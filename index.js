const fs = require('fs')
const path = require('path')
const os = require('os')

module.exports = function (angel) {
  require('angelabilities-exec')(angel)
  angel.on('register as daemon', async (angel, next) => {
    let packagejson = require(path.join(process.cwd(),'package.json'))
    let user = packagejson.osUsername || 'root'
    let destPath = `/home/${user}/${packagejson.name}`
    let serviceUnitContent = `
    [Unit]
    Description=${packagejson.name}

    [Service]
    ExecStart=/bin/bash /home/${user}/${packagejson.name}/node_modules/angelscripts-install-as-daemon/daemon.sh ${packagejson.engines.node}
    # Required on some systems
    WorkingDirectory=${destPath}
    Restart=always
    # Restart service after 10 seconds if node service crashes
    RestartSec=10
    # Output to syslog
    StandardOutput=syslog
    StandardError=syslog
    SyslogIdentifier=${packagejson.name}

    [Install]
    WantedBy=multi-user.target`
    await writeFile(`/etc/systemd/system/${packagejson.name}.service`, serviceUnitContent)
    await angel.exec([
      `systemctl enable ${packagejson.name}.service`,
      `systemctl start ${packagejson.name}.service`,
      `systemctl restart ${packagejson.name}.service`
    ].join(' && '))
    next && next()
  })
  angel.on('pack :packPath :templatePath', async (angel, next) => {
    let dirs = [
      process.cwd()
    ]
    if (angel.cmdData.templatePath !== '.') {
      dirs.push(angel.cmdData.templatePath)
    }
    let lines = await readLines(path.join(process.cwd(), '.gitignore'))
    lines.push('/.git')
    let excludes = lines.map(v => v.startsWith('/') ? `--exclude='.${v}'` : `--exclude='${v}'`)
    dirs = dirs.map(v => `-C ${v} .`)
    let cmds = [
      `mkdir -p ${path.dirname(angel.cmdData.packPath)}`,
      `tar ${excludes.join(' ')} -zcvf ${angel.cmdData.packPath} ${dirs}`
    ].join(' && ')
    if (process.env.DRY) {
      return console.info(cmds)
    }
    await angel.exec(cmds)
    next && next()
  })
  angel.on('install :remote', async (angel, next) => {
    angel.do('install ' + angel.cmdData.remote + ' .', next)
  })
  angel.on('install :remote :templatePath', async (angel, next) => {
    try {
      let packagejson = require(path.join(process.cwd(),'package.json'))
      let user = packagejson.osUsername || 'root'
      let destPath = `/home/${user}/${packagejson.name}`
      let packPath = `${os.tmpdir()}/${packagejson.name}-${packagejson.version}-deployment.tar.gz`
      let osDeps = [
        'git',
        'build-essential'
      ]
      if (packagejson.osDependencies) {
        osDeps = osDeps.concat(packagejson.osDependencies)
      }
      let cmds = [
        `npx angel pack ${packPath} ${angel.cmdData.templatePath}`,
        `ssh ${user}@${angel.cmdData.remote} '${[
          'apt-get update',
          `apt-get -y install ${[osDeps.join(' ')]}`,
          'mkdir -p ' + destPath,
          'cd ' + destPath,
          'git clone https://github.com/creationix/nvm.git ./.nvm || true',
          '. ./.nvm/nvm.sh',
          'nvm install ' + packagejson.engines.node
        ].join(' && ')}'`,
        `scp ${packPath} ${user}@${angel.cmdData.remote}:${destPath}/deployment.tar.gz`,
        `ssh ${user}@${angel.cmdData.remote} '${[
          'cd ' + destPath,
          'tar -zxf deployment.tar.gz',
          '. ./.nvm/nvm.sh',
          'nvm use ' + packagejson.engines.node,
          'npm i',
          `npx angel register as daemon`
        ].join(' && ')}'`
      ].filter(v => v).join(' && ')
      if (process.env.DRY) return console.info(cmds)
      await angel.exec(cmds)
      console.log('all done.')
      next && next()
    } catch (e) {
      console.error(e)
      next && next(e)
    }
  })
}

const readLines = function (absolute_path) {
  return new Promise((resolve, reject) => {
    fs.readFile(absolute_path, (err, data) => {
      if (err) return reject(err)
      resolve(data.toString().split('\n'))
    })
  })
}
const writeFile = function (absolute_path, content) {
  return new Promise((resolve, reject) => {
    fs.writeFile(absolute_path, content, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })
}