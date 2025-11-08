let _uuid;
try { _uuid = require('uuid').v4; } catch (e) { _uuid = () => Math.random().toString(36).slice(2, 10); }

class DrawingState {
  constructor() {
    this.actions = [];
    this.redoStack = [];
  }

  addAction(action) {
    action.opId = action.opId || _uuid();
    action.undone = false;
    action.ts = action.ts || Date.now();
    this.actions.push(action);
    this.redoStack = [];
    return action;
  }

  getActions() {
    return this.actions.filter(a => !a.undone);
  }

  undo() {
    for (let i = this.actions.length - 1; i >= 0; i--) {
      if (!this.actions[i].undone) {
        this.actions[i].undone = true;
        this.redoStack.push(this.actions[i]);
        return this.actions[i];
      }
    }
    return null;
  }

  redo() {
    const action = this.redoStack.pop();
    if (action) {
      action.undone = false;
      return action;
    }
    return null;
  }
}

module.exports = DrawingState;
