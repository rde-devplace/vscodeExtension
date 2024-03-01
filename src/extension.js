const vscode = require('vscode');
const axios = require('axios'); // axios 라이브러리를 사용하여 HTTP 요청을 보낼 수 있습니다.

class MyCustomViewProvider {
    getTreeItem(element) {
      return element;
    }
  
    getChildren(element) {
        if (element === undefined) {
            // "Enter URL" 항목을 TreeView에 추가
            const enterUrlItem = new vscode.TreeItem('Enter URL');
            enterUrlItem.command = {
                command: 'extension.fetchData', // 클릭 시 실행될 커맨드
                title: 'Enter URL', // 툴팁 텍스트
            };
            
            // Enter JSONPlaceholder and Button/Text Box 아이템 추가
            const enterGoogleItem = new vscode.TreeItem('Enter JSONPlaceholder');
            enterGoogleItem.command = {
                command: 'extension.openJSONPlaceholder', // 새로운 커맨드
                title: 'Enter JSONPlaceholder',
            };

            // External Browser로 AMDP 열기
            const enterAmdp = new vscode.TreeItem('Enter AMDP');
            enterAmdp.command = {
                command: 'extension.openAMDP', // 새로운 커맨드
                title: 'Enter External AMDP Browser',
            };

        return [enterUrlItem, enterGoogleItem, enterAmdp];
        }
        return [];
    }
  }

  function activate(context) {
    const myCustomViewProvider = new MyCustomViewProvider();
    vscode.window.registerTreeDataProvider('myView', myCustomViewProvider);

    // 1. Enter URL을 클릭하면 URL을 입력받고, 해당 URL로 데이터를 가져와 WebView에 표시
    let disposable = vscode.commands.registerCommand('extension.fetchData', async () => {
        // URL 입력받기
        const url = await vscode.window.showInputBox({
            placeHolder: 'Enter the URL to fetch data',
            prompt: '참고 URL: https://jsonplaceholder.typicode.com/todos/1. 이 URL을 참고하여 입력해주세요.'
        });

        if (url) {
            fetchDataAndShowWebView(url, context, 'default');
        }
    });

    context.subscriptions.push(disposable);


    // 2. index를 text에 입력하고 버튼을 누르면 JSONPlaceholder로 데이터를 가져와 WebView에 표시
    let elegant = vscode.commands.registerCommand('extension.openJSONPlaceholder', async () => {
        const url = vscode.Uri.parse('https://jsonplaceholder.typicode.com/todos/1');
        if (url) {
            fetchDataAndShowWebView(url, context, 'Elegant');
        }
    });
    context.subscriptions.push(elegant);


    // 3. AMDP를 외부 브라우저로 열기
    let openAmdp = vscode.commands.registerCommand('extension.openAMDP', async () => {
        const uri = vscode.Uri.parse('https://console-dev.skamdp.org');
        await vscode.env.openExternal(uri);
    });
    context.subscriptions.push(openAmdp);
}


async function fetchDataAndShowWebView(url, context, panelType = 'default') {
    try {
        // Use axios to fetch data from the URL
        const response = await axios.get(url);
        const data = response.data;

        // Create a new WebView panel
        const panel = vscode.window.createWebviewPanel(
            'webView', // Identifies the type of the webview. Used internally
            'Web Data Viewer', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            {
                // Enable scripts in the webview
                enableScripts: true
            }
        );

        // Set the HTML content of the WebView panel
        if(panelType === 'default') {
            panel.webview.html = createWebViewContent(data);
        } else {
            panel.webview.html = createWebViewWithElegant(data);
        } 

        // Handle messages from the webview (if necessary)
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'fetchData':
                        // You can handle additional commands from the WebView here
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage('Failed to fetch data.');
    }
}

// Function to generate WebView HTML content, including the fetched data
function createWebViewContent(data) {
    // Note: You might want to properly escape or sanitize data to prevent XSS
    // Especially if the data includes HTML or script elements
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>JSON Viewer</title>
        </head>
        <body>
            <h1>Data Fetched</h1>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        </body>
        </html>
    `;
}

function createWebViewWithElegant(data) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>JSON Viewer</title>
        </head>
        <body>
            <h1>Data Fetched</h1>
            <pre>${JSON.stringify(data, null, 2)}</pre>
            <!-- 데이터 입력을 위한 텍스트 박스 추가 -->
            <input type="text" id="dataInput" placeholder="Enter new data here"><br> <!-- 여기에 <br> 추가 -->
            <!-- <br> 태그를 추가하여 버튼을 다음 줄로 이동 -->
            <button id="submitData">Submit Data</button>
            <script>
                const vscode = acquireVsCodeApi();
                document.getElementById('submitData').addEventListener('click', () => {
                    // 텍스트 박스에서 입력된 데이터를 가져옵니다.
                    const inputData = document.getElementById('dataInput').value;
                    // 'submitData' 커맨드와 함께 입력된 데이터를 VS Code 확장으로 보냅니다.
                    vscode.postMessage({
                        command: 'submitData',
                        text: inputData
                    });
                });
            </script>
        </body>
        </html>
    `;
}

// www.google.com을 WebView에서 열기
function openGoogleInWebView(context) {
    const panel = vscode.window.createWebviewPanel(
        'googleWeb', // WebView 유형
        'Google', // 패널 타이틀
        vscode.ViewColumn.One, // 표시할 열
        {
            // 스크립트 활성화
            enableScripts: true
        }
    );

    // Google 홈페이지 로딩
    panel.webview.html = `
        <iframe src="https://kube-proxy.amdp-dev.skamdp.org/console" width="800" height="600"></iframe>
    `;
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
