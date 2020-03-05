"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _paperCore = require("paper/dist/paper-core");

var _paperCore2 = _interopRequireDefault(_paperCore);

require("./whiteboard.css");

var _Undo = require("./Undo");

var _Undo2 = _interopRequireDefault(_Undo);

var _Redo = require("./Redo");

var _Redo2 = _interopRequireDefault(_Redo);

var _Clear = require("./Clear");

var _Clear2 = _interopRequireDefault(_Clear);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var OTWhiteBoard = function (_Component) {
  _inherits(OTWhiteBoard, _Component);

  function OTWhiteBoard(props, context) {
    _classCallCheck(this, OTWhiteBoard);

    var _this = _possibleConstructorReturn(this, (OTWhiteBoard.__proto__ || Object.getPrototypeOf(OTWhiteBoard)).call(this, props));

    _this.clearCanvas = function () {
      _paperCore2.default.project.clear();
      _paperCore2.default.view.update();
      _this.drawHistory = [];
      _this.pathStack = [];
      _this.undoStack = [];
      _this.redoStack = [];
      _this.count = 0;
    };

    _this.changeColor = function (selectedColor) {
      _this.setState({
        color: selectedColor.backgroundColor
      });
      _this.erasing = false;
    };

    _this.clear = function () {
      _this.clearCanvas();
      // Session clear goes here
      if (_this.state.session) {
        _this.state.session.signal({
          type: "otWhiteboard_clear"
        });
      }
    };

    _this.erase = function () {
      _this.erasing = true;
    };

    _this.undo = function () {
      if (!_this.undoStack.length) return;
      var uuid = _this.undoStack.pop();
      _this.undoWhiteBoard(uuid);
      _this.sendUpdate("otWhiteboard_undo", uuid);
    };

    _this.undoWhiteBoard = function (uuid) {
      _this.redoStack.push(uuid);
      _this.pathStack.forEach(function (path) {
        if (path.uuid === uuid) {
          path.visible = false;
          _paperCore2.default.view.update();
        }
      });
      _this.drawHistory.forEach(function (update) {
        if (update.uuid === uuid) {
          update.visible = false;
        }
      });
    };

    _this.redo = function () {
      if (!_this.redoStack.length) return;
      var uuid = _this.redoStack.pop();
      _this.redoWhiteBoard(uuid);
      _this.sendUpdate("otWhiteboard_redo", uuid);
    };

    _this.redoWhiteBoard = function (uuid) {
      _this.undoStack.push(uuid);
      _this.pathStack.forEach(function (path) {
        if (path.uuid === uuid) {
          path.visible = true;
          _paperCore2.default.view.update();
        }
      });
      _this.drawHistory.forEach(function (update) {
        if (update.uuid === uuid) {
          update.visible = true;
        }
      });
    };

    _this.draw = function (update) {
      _this.drawHistory.push(update);
      switch (update.event) {
        case "start":
          var path = new _paperCore2.default.Path();
          path.selected = false;
          path.strokeColor = update.color;
          path.strokeWidth = _this.lineWidth;
          path.strokeCap = _this.strokeCap;
          path.strokeJoin = _this.strokeJoin;
          path.uuid = update.uuid;
          if (update.mode === "eraser") {
            path.blendMode = "destination-out";
            path.strokeWidth = 50;
          }

          if (update.visible !== undefined) {
            path.visible = update.visible;
          }
          var start = new _paperCore2.default.Point(update.fromX, update.fromY);
          path.moveTo(start);
          _paperCore2.default.view.draw();

          _this.pathStack.push(path);
          break;
        case "drag":
          _this.pathStack.forEach(function (pathItem) {
            if (pathItem.uuid === update.uuid) {
              pathItem.add(update.toX, update.toY);
              _paperCore2.default.view.draw();
            }
          });
          break;
        case "end":
          _this.pathStack.forEach(function (pathItem) {
            if (pathItem.uuid === update.uuid) {
              _this.undoStack.push(pathItem.uuid);
              pathItem.simplify();
              _paperCore2.default.view.draw();
            }
          });
          break;
      }
    };

    _this.drawUpdates = function (updates) {
      updates.forEach(function (updateItem) {
        _this.draw(updateItem);
      });
    };

    _this.onCanvas = function (event) {
      if ((event.type === "mousemove" || event.type === "touchmove" || event.type === "mouseout") && !_this.client.dragging) {
        // Ignore mouse move Events if we're not dragging
        return;
      }

      event.preventDefault();

      var _this$canvas$getBound = _this.canvas.getBoundingClientRect(),
          left = _this$canvas$getBound.left,
          top = _this$canvas$getBound.top;

      var scaleX = _this.canvas.width / event.target.width;
      var scaleY = _this.canvas.height / event.target.height;
      var offsetX = event.clientX - left;
      var offsetY = event.clientY - top;
      var X = offsetX * scaleX;
      var Y = offsetY * scaleY;
      var mode = _this.erasing ? "eraser" : "pen";
      if (event.type === "mousedown" || event.type === "touchstart") {
        _this.client.dragging = true;
        _this.client.lastX = X;
        _this.client.lastY = Y;
        _this.client.uuid = parseInt(X) + parseInt(Y) + Math.random().toString(36).substring(2);
        var update = {
          id: _this.state.session && _this.state.session.connection && _this.state.session.connection.connectionId,
          uuid: _this.client.uuid,
          fromX: _this.client.lastX,
          fromY: _this.client.lastY,
          mode: mode,
          color: _this.state.color,
          event: "start"
        };
        _this.draw(update);
        _this.sendUpdate("otWhiteboard_update", update);
      } else if (event.type === "mousemove" || event.type === "touchmove") {
        if (_this.client.dragging) {
          // Build update object
          var _update = {
            id: _this.state.session && _this.state.session.connection && _this.state.session.connection.connectionId,
            uuid: _this.client.uuid,
            fromX: _this.client.lastX,
            fromY: _this.client.lastY,
            toX: X,
            toY: Y,
            event: "drag"
          };
          _this.count++;
          _this.redoStack = [];
          _this.client.lastX = X;
          _this.client.lastY = Y;
          _this.draw(_update);
          _this.sendUpdate("otWhiteboard_update", _update);
        }
      } else if (event.type === "touchcancel" || event.type === "mouseup" || event.type === "touchend" || event.type === "mouseout") {
        if (_this.count) {
          var _update2 = {
            id: _this.state.session && _this.state.session.connection && _this.state.session.connection.connectionId,
            uuid: _this.client.uuid,
            event: "end"
          };

          _this.draw(_update2);
          _this.sendUpdate("otWhiteboard_update", _update2);
        }

        _this.client.dragging = false;
        _this.client.uuid = false;
      }
    };

    _this.batchSignal = function (type, data, toConnection) {
      // We send data in small chunks so that they fit in a signal
      // Each packet is maximum ~250 chars, we can fit 8192/250 ~= 32 updates per signal
      var dataCopy = data.slice();
      var signalError = function signalError(err) {
        if (err) {
          console.error(err);
        }
      };
      while (dataCopy.length) {
        var dataChunk = dataCopy.splice(0, Math.min(dataCopy.length, 32));
        var signal = {
          type: type,
          data: JSON.stringify(dataChunk)
        };
        if (toConnection) signal.to = toConnection;
        _this.state.session.signal(signal, signalError);
      }
    };

    _this.sendUpdate = function (type, update, toConnection) {
      if (_this.state.session) {
        _this.batchUpdates.push(update);
        if (!_this.updateTimeout) {
          _this.updateTimeout = setTimeout(function () {
            _this.batchSignal(type, _this.batchUpdates, toConnection);
            _this.batchUpdates = [];
            _this.updateTimeout = null;
          }, 100);
        }
      }
    };

    _this.requestHistory = function () {
      _this.state.session.signal({
        type: "otWhiteboard_request_history"
      });
    };

    _this.state = {
      session: props.session || context.session || null,
      color: "black"
    };
    _this.canvas;
    _this.colors = [{ backgroundColor: "black" }, { backgroundColor: "blue" }, { backgroundColor: "red" }, { backgroundColor: "green" }, { backgroundColor: "orange" }, { backgroundColor: "purple" }, { backgroundColor: "brown" }];
    _this.captureButton;
    _this.client = { dragging: false };
    _this.count = 0; // Grabs the total count of each continuous stroke
    _this.undoStack = []; // Stores the value of start and count for each continuous stroke
    _this.redoStack = []; // When undo pops, data is sent to redoStack
    _this.pathStack = [];
    _this.drawHistory = [];
    _this.drawHistoryReceivedFrom;
    _this.drawHistoryReceived;
    _this.batchUpdates = [];
    _this.resizeTimeout;
    _this.iOS = /(iPad|iPhone|iPod)/g.test(navigator.userAgent);
    _this.strokeCap = "round";
    _this.strokeJoin = "round";
    _this.lineWidth = 1;
    _this.erasing;
    return _this;
  }

  _createClass(OTWhiteBoard, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      // Create an empty project and a view for the canvas:
      _paperCore2.default.setup(this.canvas);
      // Create a Paper.js Path to draw a line into it:
      this.canvas.width = this.props.width;
      this.canvas.height = this.props.height;

      // Set paper.js view size
      _paperCore2.default.view.viewSize = new _paperCore2.default.Size(this.canvas.width, this.canvas.height);
      _paperCore2.default.view.draw();
      // Draw the view now:
      _paperCore2.default.view.draw();
    }

    // eslint-disable-next-line react/sort-comp

  }, {
    key: "componentDidUpdate",
    value: function componentDidUpdate(prevProps, prevState, snapshot) {
      var _this2 = this;

      if (this.state.session) {
        if (this.state.session.isConnected()) {
          this.requestHistory();
        }
        this.state.session.on({
          sessionConnected: function sessionConnected() {
            this.requestHistory();
          },

          "signal:otWhiteboard_update": function signalOtWhiteboard_update(event) {
            if (event.from.connectionId !== _this2.state.session.connection.connectionId) {
              _this2.drawUpdates(JSON.parse(event.data));
            }
          },
          "signal:otWhiteboard_undo": function signalOtWhiteboard_undo(event) {
            if (event.from.connectionId !== _this2.state.session.connection.connectionId) {
              JSON.parse(event.data).forEach(function (data) {
                _this2.undoWhiteBoard(data);
              });
            }
          },
          "signal:otWhiteboard_redo": function signalOtWhiteboard_redo(event) {
            if (event.from.connectionId !== _this2.state.session.connection.connectionId) {
              JSON.parse(event.data).forEach(function (data) {
                _this2.redoWhiteBoard(data);
              });
            }
          },
          "signal:otWhiteboard_history": function signalOtWhiteboard_history(event) {
            // We will receive these from everyone in the room, only listen to the first
            // person. Also the data is chunked together so we need all of that person's
            if (!_this2.drawHistoryReceivedFrom || _this2.drawHistoryReceivedFrom === event.from.connectionId) {
              _this2.drawHistoryReceivedFrom = event.from.connectionId;
              _this2.drawUpdates(JSON.parse(event.data));
            }
          },
          "signal:otWhiteboard_clear": function signalOtWhiteboard_clear(event) {
            if (event.from.connectionId !== _this2.state.session.connection.connectionId) {
              _this2.clearCanvas();
            }
          },
          "signal:otWhiteboard_request_history": function signalOtWhiteboard_request_history(event) {
            if (_this2.drawHistory.length > 0) {
              _this2.batchSignal("otWhiteboard_history", _this2.drawHistory, event.from);
            }
          }
        });
      }
    }
  }, {
    key: "render",
    value: function render() {
      var _this3 = this;

      return _react2.default.createElement(
        "div",
        {
          className: "ot-whiteboard",
          style: {
            height: this.props.height + "px" || "550px",
            width: this.props.width + "px"
          }
        },
        _react2.default.createElement("canvas", {
          // hidpi="off"
          ref: function ref(_ref) {
            return _this3.canvas = _ref;
          },
          onTouchCancel: this.onCanvas,
          onTouchEnd: this.onCanvas,
          onTouchMove: this.onCanvas,
          onTouchStart: this.onCanvas,
          onMouseDown: this.onCanvas,
          onMouseMove: this.onCanvas,
          onMouseUp: this.onCanvas,
          onMouseOut: this.onCanvas
        }),
        _react2.default.createElement(
          "div",
          { className: "OT_panel" },
          _react2.default.createElement(
            "div",
            { className: "color_palette" },
            this.colors.map(function (color) {
              return _react2.default.createElement("div", {
                key: color.backgroundColor,
                className: "OT_color " + (_this3.state.color === color.backgroundColor ? "selected" : ""),
                style: color,
                onClick: function onClick() {
                  return _this3.changeColor(color);
                }
              });
            }),
            _react2.default.createElement("input", {
              type: "button",
              onClick: this.erase,
              className: "OT_erase",
              value: "Eraser"
            })
          ),
          _react2.default.createElement(
            "div",
            { className: "action_buttons" },
            _react2.default.createElement(
              "div",
              { onClick: this.undo, className: "OT_action" },
              _react2.default.createElement(_Undo2.default, null)
            ),
            _react2.default.createElement(
              "div",
              { onClick: this.redo, className: "OT_action" },
              _react2.default.createElement(_Redo2.default, null)
            ),
            _react2.default.createElement(
              "div",
              { onClick: this.clear, className: "OT_action" },
              _react2.default.createElement(_Clear2.default, null)
            )
          )
        )
      );
    }
  }]);

  return OTWhiteBoard;
}(_react.Component);

exports.default = OTWhiteBoard;

OTWhiteBoard.propTypes = {
  session: _propTypes2.default.shape({
    signal: _propTypes2.default.func,
    on: _propTypes2.default.func
  }),
  width: _propTypes2.default.number.isRequired,
  height: _propTypes2.default.number.isRequired
};
OTWhiteBoard.defaultProps = {
  session: null,
  width: 500,
  height: 500
};
OTWhiteBoard.contextTypes = {
  session: _propTypes2.default.shape({
    signal: _propTypes2.default.func,
    on: _propTypes2.default.func
  }),
  streams: _propTypes2.default.arrayOf(_propTypes2.default.object)
};