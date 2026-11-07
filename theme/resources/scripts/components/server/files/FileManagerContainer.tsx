import React from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import VsCodeFileManager from '@/components/server/files/VsCodeFileManager';

export default () => {
    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <VsCodeFileManager />
            </ErrorBoundary>
        </ServerContentBlock>
    );
};
