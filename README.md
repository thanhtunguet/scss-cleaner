scss-cleaner
------------
_Scss cleaner for React Native project using [`react-native-sass-transformer`](https://www.npmjs.com/package/react-native-sass-transformer)._

Prequesites:
- React Native project
- Using [`react-native-sass-transformer`](https://www.npmjs.com/package/react-native-sass-transformer)
- Each component and screen has its own scss file with the same filename, (file extension is the only difference)
- Styles are imported with name `styles`. This is very important

For example:
If you have a component with filename `ButtonComponent.tsx`, you should name its styles file as `ButtonComponent.scss`, put it in the same folder, and write import statement exactly like below:

```typescript
import styles from './ButtonComponent.scss';
```

CLI Usage
---------

```
Usage: scss-clean [options] [command]

Options:
  -h, --help      display help for command

Commands:
  clean           Clean scss for a specific project root
                  folder
  help [command]  display help for command
```