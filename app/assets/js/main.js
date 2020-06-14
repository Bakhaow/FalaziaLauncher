const { ipcRenderer, remote, shell } = require('electron');
const request = require('request');
const { dialog } = require('electron').remote;
const fs = require('fs');
const LoggerUtil = require('./assets/js/loggerutil');
const loggerLogin = LoggerUtil('%c[Login]', 'color: #209b07; font-weight: bold;');
const dir = remote.app.getPath('userData') + '/FalaziaLauncher';

function log() {
  let user = document.getElementById('pseudo');
  let pass = document.getElementById('password');
  const url = 'https://falazia.fr/auth/start?username=' + user.value + '&password=' + Sha256.hash(pass.value);
  request({
    url: url,
    json: false
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      loggerLogin.log("trying to connect");
      if(body == 'success_ok'){
        loggerLogin.log('Logged in as ' + user.value);
        credentialsSaver();
        ipcRenderer.send('logged-in');
      } else if(body == 'error_password'){
        loggerLogin.log('Bad credentials');
        dialog.showErrorBox("Authentification", "Mauvais couple pseudo/password !");
      }
      else {
        //NO STATUS NO MSG
        dialog.showErrorBox("Erreur:","Veuillez contacter Bakhaow. Code:NSNMSG")
        loggerLogin.log('Login failed cause : none, please contact Bakhaow.');
      }
    }
  })
}

function r(f){/in/.test(document.readyState)?setTimeout(r,9,f):f()}

function init() {
  createNotExisting(dir);
  createNotExisting(dir + '/vOptions');
  if(fs.existsSync(dir + "/vOptions/ram.txt")) {
    fs.writeFile(dir + "/vOptions/ram.txt", 2, function(err) {
      if(err) {
          return loggerLogin.log(err);
      }
    })
  }
  if(fs.existsSync(dir + "/vOptions/user.txt")) {
    try {
        let data = fs.readFileSync(dir + "/vOptions/user.txt", 'utf8');
        r(function(){document.getElementById('pseudo').value = data;});
    } catch(e) {
        loggerLogin.log('Error:', e.stack);
    }
  }
}

function credentialsSaver() {
  let user = document.getElementById('pseudo');
  loggerLogin.log('Saving credentials');
  fs.writeFile(dir + "/vOptions/user.txt", user.value, function(err) {
    if(err) {
        return loggerLogin.log(err);
    }
  })
}

function ramSaver() {
  loggerLogin.log('Saving ram');
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
