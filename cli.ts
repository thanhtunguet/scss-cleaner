import {appService} from './src/views/App.service';
import fs, {BaseEncodingOptions} from 'fs';
import path from 'path';

const baseEncodingOptions: BaseEncodingOptions = {
  encoding: 'utf-8',
};

let i = 0;

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
      const filename: string = entryName.replace(/\.tsx$/, '');
      const scssName: string = `${filename}.scss`;
      const scssPath: string = path.join(basePath, scssName);
      console.log(scssPath);
      if (fs.existsSync(scssPath)) {
        const scssCode: string = fs.readFileSync(scssPath, baseEncodingOptions).toString();
        const tsxCode: string = fs.readFileSync(entryPath, baseEncodingOptions).toString();
        const usedClasses: Record<string, string> = appService.getUsedClasses(tsxCode);
        const newScss: string = appService.removeUnusedMixins(appService.clean(scssCode, usedClasses));
        fs.writeFileSync(scssPath, newScss);
        i++;
      }
    }
  }
}

cleanCode(path.resolve('..', 'vanilla-dms-app', 'src'));
console.log('%d files modified', i);
