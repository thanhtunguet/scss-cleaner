#!/usr/bin/env node

import {appService} from './views/App.service';
import fs, {BaseEncodingOptions} from 'fs';
import path from 'path';
import command from 'commander';

const baseEncodingOptions: BaseEncodingOptions = {
  encoding: 'utf-8',
};

function cleanCode(entryPath: string) {
  if (fs.existsSync(entryPath)) {
    if (fs.lstatSync(entryPath).isDirectory()) {
      fs
        .readdirSync(entryPath)
        .forEach((dirName) => {
          cleanCode(path.join(entryPath, dirName));
        })
      return;
    }
    if (entryPath.matchAll(/\.tsx$/)) {
      const entryName: string = path.basename(entryPath);
      const basePath: string = path.dirname(entryPath);
      if (entryName.match(/\.tsx?$/)) {
        const fileName: string = entryName.replace(/\.tsx$/, '');
        const scssName: string = `${fileName}.scss`;
        const scssPath: string = path.join(basePath, scssName);
        if (fs.existsSync(scssPath)) {
          try {
            const scssCode: string = fs.readFileSync(scssPath, baseEncodingOptions).toString();
            const tsxCode: string = fs.readFileSync(entryPath, baseEncodingOptions).toString();
            const usedClasses: Record<string, string> = appService.getUsedClasses(tsxCode);
            const newScss: string = appService.removeUnusedMixins(appService.clean(scssCode, usedClasses));
            fs.writeFileSync(scssPath, newScss);
          } catch (error) {
            console.log('Error occurred at file: %s', scssPath);
            console.log(error);
          }
        }
      }
    }
  }
}

command
  .command('clean <path>')
  .description('Clean scss for a specific project root folder')
  .action((directory: string) => {
    cleanCode(path.join(directory, 'src'));
  });

command.parse(process.argv);
