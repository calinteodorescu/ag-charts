import path from 'node:path';
import fsOriginal from 'node:fs';
import fs from 'node:fs/promises';
import { getIsDev } from '../../../utils/env';
import { getFolders } from '../../../utils/fs';

export const getContentRootFileUrl = (): URL => {
    const contentRoot = getIsDev()
        ? // Relative to the folder of this file
          '../../../content'
        : // Relative to `/dist/packages/ag-charts-website/chunks/pages` folder (Nx specific)
          '../../../../../packages/ag-charts-website/src/content';
    return new URL(contentRoot, import.meta.url);
};

export const getAllSourceExampleFileList = async () => {
    const contentRoot = getContentRootFileUrl();
    const pagesFolder = path.join(contentRoot.pathname, 'docs');
    const pages = await fs.readdir(pagesFolder);

    const examplesPromises = pages.map(async (pageName) => {
        const examplesFolder = path.join(pagesFolder, pageName, '_examples');
        const examples = await getFolders(examplesFolder);

        return examples.map((file) => {
            return path.join(examplesFolder, file);
        });
    });
    const exampleFolders = (await Promise.all(examplesPromises)).flat();

    const exampleFilesPromises = exampleFolders.map(async (exampleFolder) => {
        const exampleFiles = await fs.readdir(exampleFolder);
        return exampleFiles.map((exampleFile) => {
            return path.join(exampleFolder, exampleFile);
        });
    });
    const exampleFiles = (await Promise.all(exampleFilesPromises)).flat();

    return exampleFiles;
};

export const getSourceExamplesPathUrl = ({ pageName }: { pageName: string }) => {
    const contentRoot = getContentRootFileUrl();
    const examplesFolderPath = path.join('docs', pageName, '_examples');
    const sourceExamplesPath = path.join(contentRoot.pathname, examplesFolderPath);
    return new URL(sourceExamplesPath, import.meta.url);
};

export const getFrameworkFromInternalFramework = (internalFramework: string) => {
    switch (internalFramework) {
        case 'typescript':
        case 'vanilla':
            return 'javascript';
        case 'react':
        case 'reactFunctionalTs':
        case 'reactFunctional':
            return 'react';
        case 'vue':
        case 'vue3':
            return 'vue';
        default:
            return internalFramework;
    }
};

export const getEntryFileName = ({
    framework,
    internalFramework,
}: {
    framework: string;
    internalFramework: string;
}) => {
    const entryFile = {
        react: internalFramework === 'reactFunctionalTs' ? 'index.tsx' : 'index.jsx',
        // HACK: Using react template for now
        // angular: "app/app.component.ts",
        angular: 'index.jsx',
        vue: 'index.jsx',

        javascript: internalFramework === 'typescript' ? 'main.ts' : 'main.js',
    };

    return entryFile[framework as keyof typeof entryFile] || 'main.js';
};

export const getSourceFolderUrl = ({ pageName, exampleName }: { pageName: string; exampleName: string }) => {
    const examplesFolderPath = getSourceExamplesPathUrl({
        pageName,
    }).pathname;
    const exampleFolderPath = path.join(examplesFolderPath, exampleName);

    return new URL(exampleFolderPath, import.meta.url);
};

export const getSourceFileUrl = ({
    pageName,
    exampleName,
    fileName,
}: {
    pageName: string;
    exampleName: string;
    fileName: string;
}) => {
    const exampleFolderPath = getSourceFolderUrl({
        pageName,
        exampleName,
    }).pathname;
    const entryFilePath = path.join(exampleFolderPath, fileName);

    return new URL(entryFilePath, import.meta.url);
};

export const getSourceFileContents = ({
    pageName,
    exampleName,
    fileName,
}: {
    pageName: string;
    exampleName: string;
    fileName: string;
}): Promise<string | undefined> => {
    const entryFileUrl = getSourceFileUrl({
        pageName,
        exampleName,
        fileName,
    });
    return fs.readFile(entryFileUrl, 'utf-8').catch(() => {
        return undefined;
    });
};

// TODO: Find a better way to determine if an example is enterprise or not
export const getIsEnterprise = ({
    framework,
    internalFramework,
    entryFile,
}: {
    framework: string;
    internalFramework: string;
    entryFile: string;
}) => {
    const entryFileName = getEntryFileName({ framework, internalFramework });

    return entryFileName === 'main.js'
        ? entryFile?.includes('AgEnterpriseCharts')
        : entryFile?.includes('ag-charts-enterprise');
};

export const getContentsOfFileList = async ({
    pageName,
    exampleName,
    fileList,
}: {
    pageName: string;
    exampleName: string;
    fileList: string[];
}) => {
    const contentFiles = {} as Record<string, string>;
    await Promise.all(
        fileList.map(async (fileName) => {
            const file = (await getSourceFileContents({
                pageName,
                exampleName,
                fileName,
            })) as string;
            if (file) {
                contentFiles[fileName] = file;
            }
        })
    );

    return contentFiles;
};
