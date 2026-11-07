import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ServerContext } from '@/state/server';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import deleteFiles from '@/api/server/files/deleteFiles';
import renameFiles from '@/api/server/files/renameFiles';
import createDirectory from '@/api/server/files/createDirectory';
import getFileDownloadUrl from '@/api/server/files/getFileDownloadUrl';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import { httpErrorToHuman } from '@/api/http';
import useFlash from '@/plugins/useFlash';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import FileIcon, { getFileExtension } from '@/components/server/files/FileIcons';
import Spinner from '@/components/elements/Spinner';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFileAlt,
    faFolderPlus,
    faFileUpload,
    faSyncAlt,
    faSearch,
    faTimes,
    faSave,
    faChevronRight,
    faChevronDown,
    faDownload,
    faTrashAlt,
    faEdit,
    faBars,
    faCode,
} from '@fortawesome/free-solid-svg-icons';
import modes from '@/modes';
import { bytesToString } from '@/lib/formatters';
import axios from 'axios';

interface EditorTab {
    path: string;
    name: string;
    content: string;
    initialContent: string;
    isDirty: boolean;
    mode: string;
}

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const serverName = ServerContext.useStoreState((state) => state.server.data!.name);
    const { addError, addFlash, clearFlashes } = useFlash();

    const [fileList, setFileList] = useState<FileObject[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [folderContents, setFolderContents] = useState<Record<string, FileObject[]>>({});
    const [mobileExplorerOpen, setMobileExplorerOpen] = useState(false);

    const [tabs, setTabs] = useState<EditorTab[]>([]);
    const [activeTabPath, setActiveTabPath] = useState<string | null>(null);

    const [wordWrap, setWordWrap] = useState(true);
    const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
    const [saving, setSaving] = useState(false);

    const [newFileModal, setNewFileModal] = useState(false);
    const [newFolderModal, setNewFolderModal] = useState(false);
    const [renameModal, setRenameModal] = useState<{ open: boolean; file: FileObject | null; newName: string }>({
        open: false,
        file: null,
        newName: '',
    });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; file: FileObject | null }>({
        open: false,
        file: null,
    });
    const [newItemName, setNewItemName] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    let fetchActiveContent: null | (() => Promise<string>) = null;

    const refreshExplorer = useCallback(() => {
        setLoadingFiles(true);
        loadDirectory(uuid, '/')
            .then((files) => {
                files.sort((a, b) => {
                    if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
                    return a.isFile ? 1 : -1;
                });
                setFileList(files);
            })
            .catch((err) => {
                console.error(err);
                addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
            })
            .finally(() => setLoadingFiles(false));
    }, [uuid]);

    useEffect(() => {
        refreshExplorer();
    }, [refreshExplorer]);

    const activeTab = useMemo(() => {
        return tabs.find((t) => t.path === activeTabPath) || null;
    }, [tabs, activeTabPath]);

    const openFile = useCallback(
        async (file: FileObject, dir = '') => {
            const fullPath = dir ? `${dir.replace(/\/$/, '')}/${file.name}` : file.name;

            const existing = tabs.find((t) => t.path === fullPath);
            if (existing) {
                setActiveTabPath(fullPath);
                setMobileExplorerOpen(false);
                return;
            }

            try {
                const content = await getFileContents(uuid, fullPath);
                const ext = getFileExtension(file.name);
                const matchedMode = modes.find((m) => m.ext && m.ext.includes(ext));

                const newTab: EditorTab = {
                    path: fullPath,
                    name: file.name,
                    content,
                    initialContent: content,
                    isDirty: false,
                    mode: matchedMode?.mime || 'text/plain',
                };

                setTabs((prev) => [...prev, newTab]);
                setActiveTabPath(fullPath);
                setMobileExplorerOpen(false);
            } catch (err) {
                console.error(err);
                addError({ message: `Failed to open ${file.name}: ${httpErrorToHuman(err)}`, key: 'files:explorer' });
            }
        },
        [uuid, tabs]
    );

    const closeTab = (path: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const tab = tabs.find((t) => t.path === path);
        if (tab?.isDirty) {
            if (!window.confirm(`File "${tab.name}" has unsaved changes. Close anyway?`)) {
                return;
            }
        }

        const remaining = tabs.filter((t) => t.path !== path);
        setTabs(remaining);

        if (activeTabPath === path) {
            setActiveTabPath(remaining.length > 0 ? remaining[remaining.length - 1].path : null);
        }
    };

    const saveActiveTab = useCallback(async () => {
        if (!activeTab || !fetchActiveContent) return;

        setSaving(true);
        clearFlashes('files:explorer');
        try {
            const currentContent = await fetchActiveContent();
            await saveFileContents(uuid, activeTab.path, currentContent);

            setTabs((prev) =>
                prev.map((t) =>
                    t.path === activeTab.path
                        ? { ...t, content: currentContent, initialContent: currentContent, isDirty: false }
                        : t
                )
            );

            addFlash({
                key: 'files:explorer',
                type: 'success',
                message: `Saved ${activeTab.name} successfully.`,
            });
        } catch (err) {
            console.error(err);
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        } finally {
            setSaving(false);
        }
    }, [activeTab, uuid, fetchActiveContent]);

    const saveAllTabs = useCallback(async () => {
        const dirtyTabs = tabs.filter((t) => t.isDirty);
        if (dirtyTabs.length === 0) return;

        setSaving(true);
        for (const tab of dirtyTabs) {
            try {
                await saveFileContents(uuid, tab.path, tab.content);
            } catch (err) {
                console.error(err);
            }
        }
        setTabs((prev) => prev.map((t) => ({ ...t, initialContent: t.content, isDirty: false })));
        setSaving(false);
        addFlash({
            key: 'files:explorer',
            type: 'success',
            message: 'All open files saved.',
        });
    }, [tabs, uuid]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (e.shiftKey) {
                    saveAllTabs();
                } else {
                    saveActiveTab();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveActiveTab, saveAllTabs]);

    const onContentChanged = useCallback(
        (newVal: string) => {
            if (!activeTab) return;
            setTabs((prev) =>
                prev.map((t) =>
                    t.path === activeTab.path
                        ? { ...t, content: newVal, isDirty: newVal !== t.initialContent }
                        : t
                )
            );
        },
        [activeTab]
    );

    const toggleFolder = async (folderName: string, parentDir = '') => {
        const fullDir = parentDir ? `${parentDir.replace(/\/$/, '')}/${folderName}` : folderName;
        const next = new Set(expandedFolders);

        if (next.has(fullDir)) {
            next.delete(fullDir);
            setExpandedFolders(next);
        } else {
            next.add(fullDir);
            setExpandedFolders(next);
            if (!folderContents[fullDir]) {
                try {
                    const children = await loadDirectory(uuid, `/${fullDir}`);
                    children.sort((a, b) => {
                        if (a.isFile === b.isFile) return a.name.localeCompare(b.name);
                        return a.isFile ? 1 : -1;
                    });
                    setFolderContents((prev) => ({ ...prev, [fullDir]: children }));
                } catch (err) {
                    console.error(err);
                }
            }
        }
    };

    const handleCreateFile = async () => {
        if (!newItemName.trim()) return;
        setNewFileModal(false);
        try {
            await saveFileContents(uuid, newItemName.trim(), '');
            setNewItemName('');
            refreshExplorer();
            const newTab: EditorTab = {
                path: newItemName.trim(),
                name: newItemName.trim().split('/').pop() || newItemName.trim(),
                content: '',
                initialContent: '',
                isDirty: false,
                mode: 'text/plain',
            };
            setTabs((prev) => [...prev, newTab]);
            setActiveTabPath(newItemName.trim());
        } catch (err) {
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        }
    };

    const handleCreateFolder = async () => {
        if (!newItemName.trim()) return;
        setNewFolderModal(false);
        try {
            await createDirectory(uuid, '/', newItemName.trim());
            setNewItemName('');
            refreshExplorer();
        } catch (err) {
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        }
    };

    const handleRename = async () => {
        if (!renameModal.file || !renameModal.newName.trim()) return;
        const oldName = renameModal.file.name;
        const newName = renameModal.newName.trim();
        setRenameModal({ open: false, file: null, newName: '' });

        try {
            await renameFiles(uuid, '/', [{ from: oldName, to: newName }]);
            refreshExplorer();
            setTabs((prev) =>
                prev.map((t) => (t.name === oldName ? { ...t, name: newName, path: newName } : t))
            );
        } catch (err) {
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        }
    };

    const handleDelete = async () => {
        if (!deleteModal.file) return;
        const name = deleteModal.file.name;
        setDeleteModal({ open: false, file: null });

        try {
            await deleteFiles(uuid, '/', [name]);
            closeTab(name);
            refreshExplorer();
        } catch (err) {
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        }
    };

    const handleDownload = async (file: FileObject) => {
        try {
            const url = await getFileDownloadUrl(uuid, file.name);
            window.open(url, '_blank');
        } catch (err) {
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setSaving(true);
        try {
            const url = await getFileUploadUrl(uuid);
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const form = new FormData();
                form.append('files', file);
                await axios.post(url, form, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    params: { directory: '/' },
                });
            }
            refreshExplorer();
            addFlash({
                key: 'files:explorer',
                type: 'success',
                message: `Uploaded ${files.length} file(s) successfully.`,
            });
        } catch (err) {
            addError({ message: httpErrorToHuman(err), key: 'files:explorer' });
        } finally {
            setSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const filteredFiles = useMemo(() => {
        if (!searchQuery.trim()) return fileList;
        const q = searchQuery.toLowerCase();
        return fileList.filter((f) => f.name.toLowerCase().includes(q));
    }, [fileList, searchQuery]);

    return (
        <div className={'w-full h-[calc(100vh-130px)] min-h-[600px] flex flex-col bg-[#0D0D0D] border border-[#292929] rounded-xl overflow-hidden shadow-2xl relative'}>
                        <input
                ref={fileInputRef}
                type={'file'}
                multiple
                className={'hidden'}
                onChange={handleUpload}
            />

                        <div className={'md:hidden flex items-center justify-between px-3 py-2 bg-[#101010] border-b border-[#292929]'}>
                <button
                    onClick={() => setMobileExplorerOpen(!mobileExplorerOpen)}
                    className={'flex items-center space-x-2 text-xs font-medium text-[#E5E5E5] px-2.5 py-1.5 rounded bg-[#181818] border border-[#292929]'}
                >
                    <FontAwesomeIcon icon={faBars} className={'text-xs'} />
                    <span>Explorer</span>
                </button>
                <span className={'text-xs text-[#888888] font-mono'}>{activeTab?.name || 'No file open'}</span>
            </div>

                        <div className={'flex flex-1 overflow-hidden relative'}>
                                <div
                    className={`
                        w-64 md:w-72 bg-[#101010] border-r border-[#292929] flex flex-col flex-shrink-0 z-30 transition-all duration-200
                        ${mobileExplorerOpen ? 'absolute inset-y-0 left-0 shadow-2xl' : 'hidden md:flex'}
                    `}
                >
                                        <div className={'px-3.5 py-2.5 border-b border-[#292929] flex items-center justify-between bg-[#101010]'}>
                        <div className={'flex items-center space-x-2 overflow-hidden'}>
                            <span className={'text-[11px] font-bold uppercase tracking-wider text-[#929292]'}>
                                Explorer
                            </span>
                            <span className={'text-[10px] text-[#666666] truncate font-mono'}>
                                {serverName}
                            </span>
                        </div>

                                                <div className={'flex items-center space-x-1'}>
                            <button
                                onClick={() => {
                                    setNewItemName('');
                                    setNewFileModal(true);
                                }}
                                title={'New File'}
                                className={'w-6 h-6 rounded flex items-center justify-center text-[#929292] hover:text-white hover:bg-[#1E1E1E] transition-colors'}
                            >
                                <FontAwesomeIcon icon={faFileAlt} className={'text-xs'} />
                            </button>
                            <button
                                onClick={() => {
                                    setNewItemName('');
                                    setNewFolderModal(true);
                                }}
                                title={'New Folder'}
                                className={'w-6 h-6 rounded flex items-center justify-center text-[#929292] hover:text-white hover:bg-[#1E1E1E] transition-colors'}
                            >
                                <FontAwesomeIcon icon={faFolderPlus} className={'text-xs'} />
                            </button>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                title={'Upload File'}
                                className={'w-6 h-6 rounded flex items-center justify-center text-[#929292] hover:text-white hover:bg-[#1E1E1E] transition-colors'}
                            >
                                <FontAwesomeIcon icon={faFileUpload} className={'text-xs'} />
                            </button>
                            <button
                                onClick={refreshExplorer}
                                title={'Refresh Explorer'}
                                className={'w-6 h-6 rounded flex items-center justify-center text-[#929292] hover:text-white hover:bg-[#1E1E1E] transition-colors'}
                            >
                                <FontAwesomeIcon icon={faSyncAlt} className={'text-xs'} />
                            </button>
                        </div>
                    </div>

                                        <div className={'p-2 border-b border-[#202020]'}>
                        <div className={'relative'}>
                            <FontAwesomeIcon
                                icon={faSearch}
                                className={'absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#555555]'}
                            />
                            <input
                                type={'text'}
                                placeholder={'Search files...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={'w-full bg-[#0A0A0A] border border-[#262626] rounded px-2.5 py-1 pl-7 text-[11px] text-[#E5E5E5] placeholder-[#555555] outline-none focus:border-[#555555]'}
                            />
                        </div>
                    </div>

                                        <div className={'flex-1 overflow-y-auto py-1 px-1 font-mono text-xs select-none'}>
                        {loadingFiles ? (
                            <div className={'flex items-center justify-center py-8'}>
                                <Spinner size={'small'} />
                            </div>
                        ) : filteredFiles.length === 0 ? (
                            <div className={'text-center py-6 text-[11px] text-[#666666]'}>
                                {searchQuery ? 'No matching files' : 'Directory is empty'}
                            </div>
                        ) : (
                            filteredFiles.map((file) => {
                                const isDir = !file.isFile;
                                const isExpanded = expandedFolders.has(file.name);
                                const isActive = activeTabPath === file.name;

                                return (
                                    <React.Fragment key={file.key || file.name}>
                                        <div
                                            onClick={() => {
                                                if (isDir) toggleFolder(file.name);
                                                else openFile(file);
                                            }}
                                            className={`
                                                group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer transition-colors duration-100 text-[12px]
                                                ${isActive ? 'bg-[#1C1C1C] text-white font-medium' : 'text-[#BBBBBB] hover:bg-[#141414] hover:text-white'}
                                            `}
                                        >
                                            <div className={'flex items-center space-x-2 overflow-hidden flex-1 min-w-0'}>
                                                {isDir ? (
                                                    <FontAwesomeIcon
                                                        icon={isExpanded ? faChevronDown : faChevronRight}
                                                        className={'w-2.5 h-2.5 text-[#555555] flex-shrink-0'}
                                                    />
                                                ) : (
                                                    <span className={'w-2.5'} />
                                                )}

                                                <FileIcon
                                                    filename={file.name}
                                                    isDirectory={isDir}
                                                    isOpen={isExpanded}
                                                />

                                                <span className={'truncate font-sans text-xs'}>{file.name}</span>
                                            </div>

                                                                                        <div className={'hidden group-hover:flex items-center space-x-1 flex-shrink-0 pl-1'}>
                                                {file.isFile && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownload(file);
                                                        }}
                                                        title={'Download'}
                                                        className={'text-[#666666] hover:text-white p-0.5'}
                                                    >
                                                        <FontAwesomeIcon icon={faDownload} className={'text-[10px]'} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRenameModal({ open: true, file, newName: file.name });
                                                    }}
                                                    title={'Rename'}
                                                    className={'text-[#666666] hover:text-white p-0.5'}
                                                >
                                                    <FontAwesomeIcon icon={faEdit} className={'text-[10px]'} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteModal({ open: true, file });
                                                    }}
                                                    title={'Delete'}
                                                    className={'text-[#666666] hover:text-red-400 p-0.5'}
                                                >
                                                    <FontAwesomeIcon icon={faTrashAlt} className={'text-[10px]'} />
                                                </button>
                                            </div>
                                        </div>

                                                                                {isDir && isExpanded && (
                                            <div className={'pl-4 border-l border-[#202020] ml-3 mt-0.5 space-y-0.5'}>
                                                {(folderContents[file.name] || []).map((subFile) => {
                                                    const subPath = `${file.name}/${subFile.name}`;
                                                    const subActive = activeTabPath === subPath;

                                                    return (
                                                        <div
                                                            key={subPath}
                                                            onClick={() => {
                                                                if (subFile.isFile) openFile(subFile, file.name);
                                                            }}
                                                            className={`
                                                                group flex items-center justify-between px-2 py-1 rounded cursor-pointer text-[11px]
                                                                ${subActive ? 'bg-[#1C1C1C] text-white' : 'text-[#A0A0A0] hover:bg-[#141414] hover:text-white'}
                                                            `}
                                                        >
                                                            <div className={'flex items-center space-x-2 overflow-hidden flex-1 min-w-0'}>
                                                                <FileIcon
                                                                    filename={subFile.name}
                                                                    isDirectory={!subFile.isFile}
                                                                />
                                                                <span className={'truncate font-sans text-xs'}>{subFile.name}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </div>
                </div>

                                <div className={'flex-1 flex flex-col min-w-0 bg-[#0D0D0D]'}>
                                        <div className={'flex items-center bg-[#101010] border-b border-[#292929] overflow-x-auto select-none'}>
                        {tabs.map((tab) => {
                            const isActive = tab.path === activeTabPath;

                            return (
                                <div
                                    key={tab.path}
                                    onClick={() => setActiveTabPath(tab.path)}
                                    className={`
                                        group flex items-center space-x-2 px-3.5 py-2 text-xs border-r border-[#292929] cursor-pointer whitespace-nowrap transition-colors relative
                                        ${isActive ? 'bg-[#0D0D0D] text-white font-medium border-t-2 border-t-[#F0F0F0]' : 'text-[#888888] hover:bg-[#141414] hover:text-[#CCCCCC] border-t-2 border-t-transparent'}
                                    `}
                                >
                                    <FileIcon filename={tab.name} />
                                    <span className={'font-mono text-xs'}>{tab.name}</span>

                                                                        <div className={'flex items-center ml-2'}>
                                        {tab.isDirty && (
                                            <span className={'w-2 h-2 rounded-full bg-white mr-1'} title={'Unsaved changes'} />
                                        )}
                                        <button
                                            onClick={(e) => closeTab(tab.path, e)}
                                            className={'text-[#666666] hover:text-white rounded p-0.5 transition-colors'}
                                            title={'Close'}
                                        >
                                            <FontAwesomeIcon icon={faTimes} className={'text-[10px]'} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                    </div>

                                        {activeTab && (
                        <div className={'flex items-center justify-between px-4 py-1.5 bg-[#101010] border-b border-[#202020] text-xs'}>
                                                        <div className={'flex items-center space-x-1.5 text-[11px] text-[#888888] font-mono overflow-hidden'}>
                                <span>root</span>
                                <span>/</span>
                                <span className={'text-white font-medium'}>{activeTab.path}</span>
                                {activeTab.isDirty && <span className={'text-white font-bold ml-1'}>●</span>}
                            </div>

                                                        <div className={'flex items-center space-x-2 flex-shrink-0'}>
                                <button
                                    onClick={saveActiveTab}
                                    disabled={saving || !activeTab.isDirty}
                                    className={`
                                        inline-flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all
                                        ${activeTab.isDirty ? 'bg-[#F0F0F0] text-[#090909] hover:bg-white' : 'bg-[#181818] text-[#555555] border border-[#262626] cursor-default'}
                                    `}
                                    title={'Save File'}
                                >
                                    <FontAwesomeIcon icon={faSave} className={'text-xs'} />
                                    <span>{saving ? 'Saving...' : 'Save'}</span>
                                </button>

                                {tabs.some((t) => t.isDirty) && (
                                    <button
                                        onClick={saveAllTabs}
                                        disabled={saving}
                                        className={'px-2.5 py-1 rounded text-xs font-medium bg-[#1C1C1C] text-[#E5E5E5] border border-[#292929] hover:bg-[#252525] transition-colors'}
                                        title={'Save All Open Files'}
                                    >
                                        Save All
                                    </button>
                                )}

                                <button
                                    onClick={() => setWordWrap(!wordWrap)}
                                    className={`px-2 py-1 rounded text-xs font-mono border transition-colors ${wordWrap ? 'bg-[#1E1E1E] border-[#404040] text-white' : 'bg-[#141414] border-[#292929] text-[#777777]'}`}
                                    title={'Toggle Word Wrap'}
                                >
                                    Wrap
                                </button>

                            </div>
                        </div>
                    )}

                                        <div className={'flex-1 overflow-hidden relative'}>
                        {activeTab ? (
                            <CodemirrorEditor
                                key={activeTab.path}
                                mode={activeTab.mode}
                                filename={activeTab.name}
                                initialContent={activeTab.content}
                                onModeChanged={(newMode) => {
                                    setTabs((prev) =>
                                        prev.map((t) => (t.path === activeTab.path ? { ...t, mode: newMode } : t))
                                    );
                                }}
                                fetchContent={(callback) => {
                                    fetchActiveContent = callback;
                                }}
                                onContentSaved={saveActiveTab}
                                onContentChanged={onContentChanged}
                                style={{ height: '100%', minHeight: '100%' }}
                            />
                        ) : (
                            <div className={'w-full h-full flex flex-col items-center justify-center text-center p-8 select-none'}>
                                <div className={'w-16 h-16 rounded-2xl bg-[#141414] border border-[#292929] flex items-center justify-center mb-4 shadow-xl'}>
                                    <FontAwesomeIcon icon={faCode} className={'text-2xl text-[#666666]'} />
                                </div>
                                <h2 className={'text-lg font-semibold text-white tracking-tight'}>
                                    File Manager
                                </h2>
                                <p className={'text-xs text-[#888888] mt-1 max-w-sm'}>
                                    Select any file from the explorer on the left to inspect, edit, or configure.
                                </p>

                                <div className={'mt-6 grid grid-cols-2 gap-3 text-left w-full max-w-xs'}>
                                    <button
                                        onClick={() => {
                                            setNewItemName('');
                                            setNewFileModal(true);
                                        }}
                                        className={'p-3 rounded-lg bg-[#141414] border border-[#292929] hover:border-[#404040] hover:bg-[#181818] transition-colors text-xs text-[#CCCCCC]'}
                                    >
                                        <FontAwesomeIcon icon={faFileAlt} className={'mr-2 text-[#999999]'} />
                                        New File
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className={'p-3 rounded-lg bg-[#141414] border border-[#292929] hover:border-[#404040] hover:bg-[#181818] transition-colors text-xs text-[#CCCCCC]'}
                                    >
                                        <FontAwesomeIcon icon={faFileUpload} className={'mr-2 text-[#999999]'} />
                                        Upload
                                    </button>
                                </div>

                                <div className={'mt-8 flex items-center space-x-4 text-[11px] text-[#555555] font-mono'}>
                                    <span>Ctrl + S : Save</span>
                                    <span>&bull;</span>
                                    <span>Ctrl + Shift + S : Save All</span>
                                    <span>&bull;</span>
                                    <span>Ctrl + F : Find</span>
                                </div>
                            </div>
                        )}
                    </div>

                                        <div className={'h-6 bg-[#101010] border-t border-[#292929] px-4 flex items-center justify-between text-[11px] font-mono text-[#777777] select-none'}>
                        <div className={'flex items-center space-x-4'}>
                            <span className={'flex items-center space-x-1'}>
                                <span className={`w-1.5 h-1.5 rounded-full ${activeTab?.isDirty ? 'bg-amber-400' : 'bg-green-500'}`} />
                                <span className={'text-[#AAAAAA]'}>
                                    {activeTab ? (activeTab.isDirty ? 'Unsaved' : 'Saved') : 'Ready'}
                                </span>
                            </span>
                            <span>UTF-8</span>
                            <span>LF</span>
                        </div>

                        <div className={'flex items-center space-x-4'}>
                            <span>Spaces: 4</span>
                            <span>
                                {activeTab ? modes.find((m) => m.mime === activeTab.mode)?.name || 'Plain Text' : 'Text'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

                        <Dialog.Confirm
                open={newFileModal}
                title={'Create New File'}
                confirm={'Create'}
                onClose={() => setNewFileModal(false)}
                onConfirmed={handleCreateFile}
            >
                <div className={'py-2'}>
                    <label className={'text-xs text-[#999999] mb-1 block'}>File Name</label>
                    <input
                        type={'text'}
                        autoFocus
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                        placeholder={'filename.ext'}
                        className={'w-full bg-[#090909] border border-[#292929] rounded px-3 py-2 text-xs text-white outline-none focus:border-[#666666]'}
                    />
                </div>
            </Dialog.Confirm>

                        <Dialog.Confirm
                open={newFolderModal}
                title={'Create New Directory'}
                confirm={'Create Folder'}
                onClose={() => setNewFolderModal(false)}
                onConfirmed={handleCreateFolder}
            >
                <div className={'py-2'}>
                    <label className={'text-xs text-[#999999] mb-1 block'}>Folder Name</label>
                    <input
                        type={'text'}
                        autoFocus
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                        placeholder={'folder_name'}
                        className={'w-full bg-[#090909] border border-[#292929] rounded px-3 py-2 text-xs text-white outline-none focus:border-[#666666]'}
                    />
                </div>
            </Dialog.Confirm>

                        <Dialog.Confirm
                open={renameModal.open}
                title={'Rename File'}
                confirm={'Rename'}
                onClose={() => setRenameModal({ open: false, file: null, newName: '' })}
                onConfirmed={handleRename}
            >
                <div className={'py-2'}>
                    <label className={'text-xs text-[#999999] mb-1 block'}>New Name</label>
                    <input
                        type={'text'}
                        autoFocus
                        value={renameModal.newName}
                        onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        className={'w-full bg-[#090909] border border-[#292929] rounded px-3 py-2 text-xs text-white outline-none focus:border-[#666666]'}
                    />
                </div>
            </Dialog.Confirm>

                        <Dialog.Confirm
                open={deleteModal.open}
                title={'Confirm Deletion'}
                confirm={'Delete File'}
                onClose={() => setDeleteModal({ open: false, file: null })}
                onConfirmed={handleDelete}
            >
                <p className={'text-xs text-[#CCCCCC]'}>
                    Are you sure you want to delete <span className={'font-mono text-white font-bold'}>{deleteModal.file?.name}</span>? This action cannot be undone.
                </p>
            </Dialog.Confirm>
        </div>
    );
};
