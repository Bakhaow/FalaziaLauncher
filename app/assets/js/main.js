const { ipcRenderer, remote, shell } = require('electron');
const { dialog } = require('electron').remote;
const fs = require('fs');
const LoggerUtil = require('./assets/js/loggerutil');
const loggerLogin = LoggerUtil('%c[Login]', 'color: #209b07; font-weight: bold;');
const dir = remote.app.getPath('userData') + '/FalaziaLauncher';
let userInput;

function tryLogin() {
  let user = document.getElementById('pseudo');
  let pass = document.getElementById('password');
  let request = require('electron').remote.net.request('https://falazia.fr/auth/start?username=' + user.value + '&password=' + Sha256.hash(pass.value));
  request.on('response', (response) => {
    console.log(`STATUS: ${response.statusCode}`);
    response.on('data', (chunk) => {
      if(response.statusCode == 200) {
        if(chunk == 'success_ok') {
          /*if(document.getElementById('checkbox').checked) {
            loggerLogin.log('Logged in as ' + user.value);
            ipcRenderer.send('logged-in');
          } else {*/
            //credentialsSaver();
            loggerLogin.log('Logged in as ' + user.value);
            userInput = user.value;
            ipcRenderer.send('logged-in');
          //}
        } else if(chunk == 'error_password') {
          loggerLogin.log('Bad credentials');
          dialog.showErrorBox("Authentification", "Mauvais couple pseudo/password !");
        }
      } else {
        loggerLogin.log('Error contact support !');
        dialog.showErrorBox("Authentification", "Erreur inexplicable, merci de contacter Bakhaow");
      }
    });
  });
  request.end();
}

function init() {
  createNotExisting(dir);
  /*let usair = "";
  try {
      let data = fs.readFileSync(dir + "/vOptions/user.txt", 'utf8');
      usair = data;
  } catch(e) {
    loggerLogin.log(e);
  }
  if(usair.length > 1)
  document.getElementById('pseudo').value = usair;*/
}

init();

function credentialsSaver() {
  loggerLogin.log('Saving credentials');
  createNotExisting(dir + '/vOptions');
  fs.writeFile(dir + "/vOptions/user.txt", user.value, function(err) {
    if(err) {
        return loggerLogin.log(err);
    }
  })
}

function ramSaver() {
  loggerLogin.log('Saving ram');
  createNotExisting(dir + '/vOptions');
  fs.writeFile(dir + "/vOptions/ram.txt", document.getElementById('slct').options[document.getElementById('slct').selectedIndex].value, function(err) {
    if(err) {
        return loggerLogin.log(err);
    }
  })
}

function createNotExisting(directory) {
  if(!fs.existsSync(directory)){
      fs.mkdirSync(directory, 0766, function(err){
          if(err){
              loggerLogin.log(err);
          }
      });
  }
}

function closeLauncher() {
    const window = remote.getCurrentWindow();
    window.close();
}

function minimizeLauncher() {
  const window = remote.getCurrentWindow();
  window.minimize();
  document.activeElement.blur();
}

function options() {
  if(document.body.contains(document.getElementById('optionTag'))) {
    ipcRenderer.send('main');
    ramSaver();
  } else {
    ipcRenderer.send('options');
  }
}
