const { exec } = require('child_process');
const loggerDL = LoggerUtil('%c[DL]', 'color: dimgrey; font-weight: bold;');
const loggerLaunch = LoggerUtil('%c[Launch]', 'color: #abcdefg; font-weight: bold;');
const lsPath = dir + '/lightslark.exe';
const libsDir = dir + '/files/libs';
const nativesDir = dir + '/files/natives';
const dirFiles = dir + '/files';

async function checkUpdate() {
  let child = exec(dir + '/lightslark --external update https://falazia.fr/files ' + dirFiles);
  child.stdout.on('data', function(data) {
    let json = JSON.parse(data);
    let size = null;
    loggerDL.log(json);
    switch(json['type']) {
      case 'download':
        loggerDL.log('Download a new version (' + json['version'] + ')');
        loggerDL.log(json.size['compressed']);
        size = json.size['compressed'];
        document.getElementById('load-label').innerHTML = "Lancement du téléchargement...(v" + json['version'] + ")";
        break;
      case 'download-progress':
        loggerDL.log('Current_total: ' + json['current_total'] + ' | Speed: ' + json['speed']);
        document.getElementById('load-label').innerHTML = "Mise à jour en cours... <br>Merci de patienter: " + (json['current'] / size) + "% <br>";
        break;
      case 'finish':
        loggerDL.log('Download finished in : ' + json['speed']);
        launchGame();
        break;
      case 'up-to-date':
        loggerDL.log('Up 2 Date');
        document.getElementById('load-label').innerHTML = "Déjà à jour <br> ... Lancement ...";
        launchGame();
        break;
      case 'update-range':
        loggerDL.log('Bad version (' + json['from'] + ') updating to version - >' + json['to']);
        document.getElementById('load-label').innerHTML = "Passage de " + json['from'] + " à " + json['to'];
        break;
    }
  });
  child.stderr.on('data', function(data) {
    loggerDL.log('stderr: ' + data);
  });
  child.on('exit', code => {
    loggerDL.log('child process exited with code ' + code.toString());
  });
}

function firstDL(os , path){
  let url;
  if(os = 'windows') {
    url = 'http://launcher.bakhaow.fr/lightslark.exe';
  }
  let req = request({
      method: 'GET',
      uri: url
  });
  req.pipe(fs.createWriteStream(path));
  req.on('end', function() {
      wait(2000);
      loggerDL.log('checkUpdate');
      checkUpdate();
  });
}

function wait(ms){
   var start = new Date().getTime();
   var end = start;
   while(end < start + ms) {
     end = new Date().getTime();
  }
}

function launchGame() {
    let ram;
    try {
        let data = fs.readFileSync(dir + "/vOptions/ram.txt", 'utf8');
        ram = data;
    } catch(e) {
        console.log('Error:', e.stack);
    }

    var command = 'java ' + "-Xms" + ram + "G -Xmx" + ram + "G" + ' -XX:-UseAdaptiveSizePolicy -XX:+UseConcMarkSweepGC -Djava.library.path=' + nativesDir + ' -Dfml.ignoreInvalidMinecraftCertificates=true -Dfml.ignorePatchDiscrepancies=true' + ' -cp "';
    var cp = '';

    fs.readdir(libsDir, function(err, items) {
        if (err) {
            return loggerLaunch.log('Unable to scan directory: ' + err);
        }
        for (var i=0; i<items.length; i++) {
            cp = cp + libsDir + '/' + items[i] + ';';
        }
    });

    setTimeout(async function() {
        cp = cp + dirFiles + "/minecraft.jar";
        command = command + cp + '" net.minecraft.client.main.Main --username=' + userInput + ' --accessToken null --version 1.12.2 --gameDir ' + dirFiles + '  --assetIndex 1.12 --userProperties {} --uuid null';
        loggerLaunch.log("Commande de lancement: " + command);
        const launch = await exec(command);
        launch.stdout.on('data', function(data) {
          console.log('stdout: ' + data);
          wait(5000);
          closeLauncher();
        });
        launch.stderr.on('data', function(data) {
          console.log('stderr: ' + data);
        });
    }, 5000);
}

if(fs.existsSync(lsPath)) {
  checkUpdate();
} else {
  firstDL('windows', lsPath);
}
