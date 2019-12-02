# opentok-react-whiteboard

React shared whiteboard that works with [Opentok](https://github.com/opentok/opentok-react)

## Example

```js
<OTSession
  apiKey={this.props.apiKey}
  sessionId={this.props.sessionId}
  token={this.props.token}
  eventHandlers={this.sessionEvents}
  onError={this.onError}
>
  <OTWhiteBoard />
</OTSession>
```
