#!/usr/bin/env node

import command from 'commander';
import fs, {BaseEncodingOptions} from 'fs';
import path from 'path';
import {appService} from './views/App.service';
import chalk from 'chalk';

const baseEncodingOptions: BaseEncodingOptions = {
  encoding: 'utf-8',
};

function cleanCode(entryPath: string) {
  if (fs.existsSync(entryPath)) {
    if (fs.lstatSync(entryPath).isDirectory()) {
      fs.readdirSync(entryPath).forEach((dirName) => {
        cleanCode(path.join(entryPath, dirName));
      });
      return;
    }
    if (entryPath.matchAll(/\.tsx$/g)) {
      const entryName: string = path.basename(entryPath);
      const basePath: string = path.dirname(entryPath);
      if (entryName.match(/\.tsx?$/)) {
        const fileName: string = entryName.replace(/\.tsx$/, '');
        const scssName: string = `${fileName}.scss`;
        const scssPath: string = path.join(basePath, scssName);
        if (fs.existsSync(scssPath)) {
          try {
            const scssCode: string = fs
              .readFileSync(scssPath, baseEncodingOptions)
              .toString()
              .split(/;{2,}/gm)
              .join(';');
            const tsxCode: string = fs
              .readFileSync(entryPath, baseEncodingOptions)
              .toString();
            const usedClasses: Record<
              string,
              string
            > = appService.getUsedClasses(tsxCode);
            const newScss: string = appService.removeUnusedMixins(
              appService.clean(scssCode, usedClasses),
            );
            fs.writeFileSync(scssPath, newScss.split(/\n{3,}/gm).join('\n\n'));
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
              'Error occurred at file: %s',
              chalk.blueBright(scssPath),
            );
            // eslint-disable-next-line no-console
            console.error(error);
          }
        }
      }
    }
  }
}

command
  .command('clean')
  .description('Clean scss for a specific project root folder')
  .action(() => {
    cleanCode(path.join(process.cwd(), 'src'));
  });

command.parse(process.argv);
