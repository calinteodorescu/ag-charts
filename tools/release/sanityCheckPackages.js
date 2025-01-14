// Note: Assumes working directory is the root of the mono-repo

const getPackageInformation = require('./utils/utils').getPackageInformation;

if (process.argv.length < 3) {
    console.log('Usage: node scripts/sanityCheckPackages.js [Chart Version]');
    console.log('For example: node scripts/validateAgPackageAndDeps.js 10.0.0');
    console.log('Note: This script should be run from the root of the monorepo');
    process.exit(1);
}
const [exec, scriptPath, chartNewVersion] = process.argv;

if (!chartNewVersion) {
    console.error('ERROR: Invalid charts version supplied');
    process.exit(1);
}

console.log(
    '******************************************************************************************************************************'
);
console.log(`Verify Charts Version ${chartNewVersion} are the dependencies used in package.json         `);
console.log(
    '******************************************************************************************************************************'
);

let errorFound = false;

const allPackages = getPackageInformation();
const packageNames = Object.keys(allPackages);
packageNames
    .filter(
        (packageName) =>
            packageName != 'ag-shared' &&
            packageName !== 'ag-charts-community-examples' &&
            packageName !== 'ag-charts-website' &&
            packageName !== 'ag-charts-task-autogen'
    )
    .forEach((packageName) => {
        const agPackage = allPackages[packageName];
        const {
            projectRoot,
            isGridPackage,
            version,
            agGridDeps,
            agChartDeps,
            agSubAngularVersion,
            agSubAngularGridDeps,
            agSubAngularChartDeps,
        } = agPackage;

        function checkDependency(dependencyName, currentVersion, expectedVersion) {
            if (currentVersion !== expectedVersion) {
                console.error(
                    `${dependencyName} in ${projectRoot}/package.json has ${currentVersion} but we expect it to be ${expectedVersion}`
                );

                errorFound = true;
            }
        }

        checkDependency(packageName, version, isGridPackage ? gridNewVersion : chartNewVersion);
        Object.keys(agPackage.agGridDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agGridDeps[dependencyName], gridNewVersion)
        );
        Object.keys(agPackage.agGridPeerDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agPackage.agGridPeerDeps[dependencyName], gridNewVersion)
        );
        Object.keys(agPackage.agChartDeps).forEach((dependencyName) =>
            checkDependency(dependencyName, agChartDeps[dependencyName], chartNewVersion)
        );

        if (agSubAngularVersion) {
            checkDependency(packageName, agSubAngularVersion, isGridPackage ? gridNewVersion : chartNewVersion);
        }

        if (agSubAngularGridDeps) {
            Object.keys(agSubAngularGridDeps).forEach((dependencyName) =>
                checkDependency(dependencyName, agSubAngularGridDeps[dependencyName], gridNewVersion)
            );
        }
        if (agSubAngularChartDeps) {
            Object.keys(agSubAngularChartDeps).forEach((dependencyName) =>
                checkDependency(dependencyName, agSubAngularChartDeps[dependencyName], chartNewVersion)
            );
        }
    });

if (errorFound) {
    console.error('ERROR: One more errors found - please see messages above');
    process.exit(1);
}
