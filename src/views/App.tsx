import React from 'react';
import 'views/App.scss';
import Button from 'antd/lib/button';
import {Col, Row} from 'antd/lib/grid';
import {Controlled as CodeMirror} from 'react-codemirror2';
import {appService} from 'src/views/App.service';
import 'codemirror/mode/sass/sass';
import 'codemirror/mode/jsx/jsx';
import {message} from 'antd';
import {EditorConfiguration} from 'codemirror';

const scssOptions: EditorConfiguration = appService.getCodeMirrorOption('sass');
const tsxOptions: EditorConfiguration = appService.getCodeMirrorOption('jsx');

function App() {
  const [scss, setScss] = React.useState<string>('');
  const handleChangeScss = React.useCallback((...[, , data]) => {
    setScss(data);
  }, []);

  const [tsx, handleChangeTsx] = React.useState<string>('');
  const handleChangeClasses = React.useCallback((...[, , data]) => {
    handleChangeTsx(data);
  }, []);

  const usedClasses: Record<string, string> = React.useMemo(() => {
    return appService.getUsedClasses(tsx);
  }, [tsx]);

  const handleClean = React.useCallback(() => {
    const newScss: string = appService.removeUnusedMixins(
      appService.clean(scss, usedClasses),
    );
    const removedLines: number = appService.getNumLineOfCodeRemoved(
      scss,
      newScss,
    );
    message.info(`${removedLines} lines of code removed`);
    setScss(newScss);
  }, [scss, usedClasses]);

  return (
    <div className="app">
      <Row>
        <Col span={12} className="px-2">
          <h3 className="h3">TSX Code</h3>
          <CodeMirror
            options={tsxOptions}
            value={tsx}
            onBeforeChange={handleChangeClasses}
          />
        </Col>
        <Col span={12} className="px-2">
          <h3 className="h3">SCSS Code</h3>
          <CodeMirror
            options={scssOptions}
            value={scss}
            onBeforeChange={handleChangeScss}
          />
        </Col>
      </Row>
      <Row className="mt-2">
        <Col className="px-2">
          <Button type="primary" onClick={handleClean}>
            Clean
          </Button>
        </Col>
      </Row>
    </div>
  );
}

export default App;
