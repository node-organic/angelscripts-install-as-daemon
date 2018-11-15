# angelscripts-install-as-daemon

Organelle deploys organic cells on `vps` infrastructure.

Benefits: 
 - Daemon *can* deploy a new cell without to remove the previous cell
 - Updating a new version of cell doesn't need ecosystem to be rebuild (*Zero downtime deployment*)
 - Daemon is using `nginx`

## How to install

The minimal version of nodejs is: `Nodejs version 4+`

Open your terminal and run:

```bash
npm install organic-watch-json-dir --save-dev
```

## VPS requirements

`angelscripts-install-as-daemon` requires `Ubuntu` version 14.04+ or Debian version 7+

## Testing

Organelle doesn't have a test section. Why ?

Simulation of vps is really a tough task and for us is wasting of time.

If you project requires testing module of vps configuration. You're more than welcome to fork this cell.

## Contributing

We 🧡 contribution. Please follow these simple rules: 

- Ensure any install or build dependencies are removed before the end of the layer when doing a new version of package.
- Update the `README.md` with details of changes. This includes new environment variables, useful file locations and parameters.
- Increase the version numbers in any examples files and the `README.md` to the new version that this Pull Request would represent. 
- Have fun 🔥💫