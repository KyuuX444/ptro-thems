import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faFile,
    faFolder,
    faFolderOpen,
    faCode,
    faFileAlt,
    faFileArchive,
    faFileImage,
    faCog,
    faTerminal,
    faDatabase,
    faCube,
} from '@fortawesome/free-solid-svg-icons';

interface FileIconProps {
    filename: string;
    isDirectory?: boolean;
    isOpen?: boolean;
    className?: string;
}

export const getFolderIcon = (name: string, isOpen: boolean) => {
    const lower = name.toLowerCase();
    let color = '#CCCCCC';

    if (lower === 'src' || lower === 'app') color = '#99CCFF';
    else if (lower === 'assets' || lower === 'public' || lower === 'static') color = '#FFE082';
    else if (lower === 'config' || lower === 'settings') color = '#A5D6A7';
    else if (lower === 'plugins' || lower === 'modules' || lower === 'node_modules') color = '#CE93D8';
    else if (lower === 'data' || lower === 'database') color = '#80CBC4';
    else if (lower === 'logs' || lower === 'log') color = '#FFAB91';

    return (
        <FontAwesomeIcon
            icon={isOpen ? faFolderOpen : faFolder}
            style={{ color }}
            className={'w-3.5 h-3.5 flex-shrink-0'}
        />
    );
};

export const getFileExtension = (filename: string): string => {
    const dot = filename.lastIndexOf('.');
    return dot > -1 ? filename.substring(dot + 1).toLowerCase() : '';
};

export const FileIcon = ({ filename, isDirectory, isOpen = false, className = '' }: FileIconProps) => {
    if (isDirectory) {
        return <span className={className}>{getFolderIcon(filename, isOpen)}</span>;
    }

    const lower = filename.toLowerCase();
    const ext = getFileExtension(filename);

    // Special exact files
    if (lower === 'package.json') {
        return (
            <span className={`inline-flex items-center justify-center font-bold text-[9px] w-3.5 h-3.5 rounded bg-[#CB3837]/20 text-[#FF8585] border border-[#CB3837]/40 ${className}`}>
                npm
            </span>
        );
    }
    if (lower === 'dockerfile') {
        return (
            <span className={`inline-flex items-center justify-center font-bold text-[9px] w-3.5 h-3.5 rounded bg-[#2496ED]/20 text-[#70C1FF] border border-[#2496ED]/40 ${className}`}>
                🐳
            </span>
        );
    }
    if (lower.startsWith('.env')) {
        return (
            <FontAwesomeIcon icon={faCog} className={`w-3.5 h-3.5 text-[#ECC94B] flex-shrink-0 ${className}`} />
        );
    }

    // Extensions
    switch (ext) {
        case 'js':
        case 'mjs':
        case 'cjs':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[9px] px-0.5 rounded bg-[#F7DF1E]/15 text-[#F7DF1E] border border-[#F7DF1E]/30 leading-none ${className}`}>
                    JS
                </span>
            );
        case 'ts':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[9px] px-0.5 rounded bg-[#3178C6]/20 text-[#60A5FA] border border-[#3178C6]/40 leading-none ${className}`}>
                    TS
                </span>
            );
        case 'tsx':
        case 'jsx':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#61DAFB]/20 text-[#61DAFB] border border-[#61DAFB]/40 leading-none ${className}`}>
                    ⚛
                </span>
            );
        case 'json':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[10px] w-3.5 h-3.5 text-[#F6AD55] ${className}`}>
                    &#123;&#125;
                </span>
            );
        case 'html':
        case 'htm':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#E34F26]/20 text-[#FF7043] border border-[#E34F26]/40 leading-none ${className}`}>
                    &lt;&gt;
                </span>
            );
        case 'css':
        case 'scss':
        case 'sass':
        case 'less':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[9px] px-0.5 rounded bg-[#1572B6]/20 text-[#42A5F5] border border-[#1572B6]/40 leading-none ${className}`}>
                    #
                </span>
            );
        case 'php':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#777BB4]/20 text-[#9FA8DA] border border-[#777BB4]/40 leading-none ${className}`}>
                    PHP
                </span>
            );
        case 'py':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#3776AB]/20 text-[#64B5F6] border border-[#3776AB]/40 leading-none ${className}`}>
                    Py
                </span>
            );
        case 'lua':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#000080]/30 text-[#90CAF9] border border-[#000080]/50 leading-none ${className}`}>
                    Lua
                </span>
            );
        case 'go':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#00ADD8]/20 text-[#4DD0E1] border border-[#00ADD8]/40 leading-none ${className}`}>
                    Go
                </span>
            );
        case 'rs':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#DEA584]/20 text-[#D7CCC8] border border-[#DEA584]/40 leading-none ${className}`}>
                    Rs
                </span>
            );
        case 'java':
        case 'jar':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[9px] text-[#FF8A65] ${className}`}>
                    ☕
                </span>
            );
        case 'yml':
        case 'yaml':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#CB171E]/20 text-[#EF5350] border border-[#CB171E]/40 leading-none ${className}`}>
                    YML
                </span>
            );
        case 'toml':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#9C4121]/20 text-[#FF8A65] border border-[#9C4121]/40 leading-none ${className}`}>
                    TOML
                </span>
            );
        case 'md':
            return (
                <span className={`inline-flex items-center justify-center font-bold text-[8px] px-0.5 rounded bg-[#E5E5E5]/15 text-[#E0E0E0] border border-[#E5E5E5]/30 leading-none ${className}`}>
                    M↓
                </span>
            );
        case 'sql':
            return (
                <FontAwesomeIcon icon={faDatabase} className={`w-3.5 h-3.5 text-[#4DD0E1] flex-shrink-0 ${className}`} />
            );
        case 'sh':
        case 'bash':
            return (
                <FontAwesomeIcon icon={faTerminal} className={`w-3.5 h-3.5 text-[#81C784] flex-shrink-0 ${className}`} />
            );
        case 'zip':
        case 'tar':
        case 'gz':
        case 'rar':
            return (
                <FontAwesomeIcon icon={faFileArchive} className={`w-3.5 h-3.5 text-[#BA68C8] flex-shrink-0 ${className}`} />
            );
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
        case 'ico':
            return (
                <FontAwesomeIcon icon={faFileImage} className={`w-3.5 h-3.5 text-[#4DB6AC] flex-shrink-0 ${className}`} />
            );
        case 'txt':
        case 'log':
            return (
                <FontAwesomeIcon icon={faFileAlt} className={`w-3.5 h-3.5 text-[#9E9E9E] flex-shrink-0 ${className}`} />
            );
        default:
            return (
                <FontAwesomeIcon icon={faFile} className={`w-3.5 h-3.5 text-[#757575] flex-shrink-0 ${className}`} />
            );
    }
};

export default FileIcon;
