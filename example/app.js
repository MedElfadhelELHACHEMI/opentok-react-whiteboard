import React, { Component } from "react";

import { OTSession, preloadScript } from "opentok-react";
import { OTWhiteBoard } from "../src";

import config from "./config";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      connected: false
    };

    this.sessionEvents = {
      sessionConnected: () => {
        this.setState({ connected: true });
      },
      sessionDisconnected: () => {
        this.setState({ connected: false });
      }
    };
  }

  componentWillMount() {
    OT.registerScreenSharingExtension("chrome", config.CHROME_EXTENSION_ID, 2);
  }

  onError = err => {
    this.setState({ error: `Failed to connect: ${err.message}` });
  };

  render() {
    return (
      <OTSession
        apiKey={this.props.apiKey}
        sessionId={this.props.sessionId}
        token={this.props.token}
        eventHandlers={this.sessionEvents}
        onError={this.onError}
      >
        <OTWhiteBoard width={560} height={560} />
      </OTSession>
    );
  }
}

export default preloadScript(App);
