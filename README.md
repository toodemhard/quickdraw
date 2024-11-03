# Quickdraw
A minimalist painting program. [Currently hosted here](https://toodemhard.github.io/quickdraw/)

![screenshot](https://github.com/user-attachments/assets/4848e4b2-a438-480d-a49c-3caf75ec7634)
![screenshot2](https://github.com/user-attachments/assets/584e6d31-90ae-42ef-8b3a-e8d6a21b7a01)

## Local Usage
Requires ```node``` and ```go```.
```bash
git clone https://github.com/toodemhard/quickdraw.git
cd quickdraw
npm i
npm run build
go run main.go
```

## Reason for Existence
Most image manipulation programs are complicated and have too many brushes which can induce analysis paralysis. Quickdraw has only one brush because that's all we can afford in this economy. The aim is to be simple and approachable so that no time gets wasted procrasinating. It is therefore more suitable for painting studies and sketches instead of really polished things. I'm also trying to make it ergonomic by letting all actions be accessble from just one hand(left or right) so that you don't have to constantly drop the pen.

## Current Features
- Customizable keybindings
- Direction following square brush
- Pressure sensitivity with tablets
- Undo/Redo with infinite history
- Color picker
- Navigation tools

## Planned Features
- Authentication and database to persist save files
- Split editor for image references
- Values filter and mirroring
