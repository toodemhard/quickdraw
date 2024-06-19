# Quickdraw
A minimalist painting program. Currently hosted [here](https://quickdraw-7yz2lteznq-nw.a.run.app).

![image](https://github.com/lailokkei/quickdraw/assets/100080774/4120894b-8b49-4793-8747-24a733eabafa)

### Reason for existence
Most image manipulation programs are complicated and have too many brushes which can induce analysis paralysis. Quickdraw has only one brush because that's all we can afford in this economy. The aim is to be simple and approachable so that no time gets wasted procrasinating. It is therefore more suitable for painting studies and sketches instead of really polished things. I'm also trying to make it ergonomic by letting all actions be accessble from just one hand(left or right) so that you don't have to constantly drop the pen.

### Why is it a w*b app?!?!?
Web is more convenient to access than natively installing but the real reason is to have an excuse to write a backend. Online collabs will definitely be added to justify everything.

## Current Features
- Customizable keybindings
- Direction following square brush
- Pressure sensitivity with tablets(on some browsers)
- Color picker
- Navigation tools
- Undo/Redo

## Planned Features
- Authentication and database to persist save files
- Split editor for image references
- Values filter and mirroring

## Local Usage
Requires ```node``` and ```go```.
```bash
git clone https://github.com/lailokkei/quickdraw.git
cd quickdraw
npm i
npm build
go run main.go
```
