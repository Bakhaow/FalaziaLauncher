const { exec } = require('child_process');
const loggerDL = LoggerUtil('%c[DL]', 'color: dimgrey; font-weight: bold;');
const loggerLaunch = LoggerUtil('%c[Launch]', 'color: #abcdefg; font-weight: bold;');
const lsPath = dir + '/lightslark.exe';
const libsDir = dir + '/files/libs';
const nativesDir = dir + '/files/natives';
const dirFiles = dir + '/files';


function checkUpdate() {
  let child = exec(dir + '/lightslark --external update https://falazia.fr/files ' + dirFiles, {
    detached: true,
    stdio: ['ignore', 1, 2, 3, 4, 5, 6, 7, 8]
  });
  child.unref();
  child.stdout.on('data', function(data) {
    let json = JSON.parse(data);
    if(Array.isArray(json)) {
      json = json[0];
    }
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
    setTimeout(function(){ checkUpdate() }, 1000);
  });
  child.on('exit', code => {
    loggerDL.log('child process exited with code ' + code.toString());
  });
}

async function download(sourceUrl, targetFile, progressCallback, length) {
  const request = new Request(sourceUrl, {
    headers: new Headers({'Content-Type': 'application/octet-stream'})
  });

  const response = await fetch(request);
  if (!response.ok) {
    throw Error(`Unable to download, server returned ${response.status} ${response.statusText}`);
  }

  const body = response.body;
  if (body == null) {
    throw Error('No response body');
  }

  const finalLength = length || parseInt(response.headers.get('Content-Length' || '0'), 10);
  const reader = body.getReader();
  const writer = fs.createWriteStream(targetFile);

  await streamWithProgress(finalLength, reader, writer, progressCallback);
  writer.end();
  setTimeout(function(){ checkUpdate() }, 1000);
}

async function streamWithProgress(length, reader, writer, progressCallback) {
  let bytesDone = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) {
      if (progressCallback != null) {
        progressCallback(length, 100);
      }
      return;
    }

    const chunk = result.value;
    if (chunk == null) {
      throw Error('Empty chunk received during download');
    } else {
      writer.write(Buffer.from(chunk));
      if (progressCallback != null) {
        bytesDone += chunk.byteLength;
        const percent = length === 0 ? null : Math.floor(bytesDone / length * 100);
        progressCallback(bytesDone, percent);
      }
    }
  }
}

function firstDL() {
  download('http://launcher.bakhaow.fr/lightslark.exe', lsPath, (bytes, percent) => document.getElementById('load-label').innerHTML = "Préparation: " + percent + "%");
}


function showProgress(received,total){
    var percentage = (received * 100) / total;
    console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
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

    let pseudonyme;
    try {
        let data = fs.readFileSync(dir + "/vOptions/user.txt", 'utf8');
        pseudonyme = data;
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
        command = command + cp + '" net.minecraft.client.main.Main --username=' + pseudonyme + ' --accessToken null --version 1.12.2 --gameDir ' + dirFiles + '  --assetIndex 1.12 --userProperties {} --uuid null';
        loggerLaunch.log("Commande de lancement: " + command);
        const launch = await exec(command);
        launch.stdout.on('data', function(data) {
          console.log('stdout: ' + data);
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
  firstDL();
  //firstDL('windows', lsPath);
}
