import { Response, Request } from "express";
import { Router } from "express-serve-static-core";
import * as vscode from "vscode";
import { listen, MessageConnection } from 'vscode-ws-jsonrpc';
import {
  MonacoLanguageClient, CloseAction, ErrorAction,
  MonacoServices, createConnection
} from 'monaco-languageclient';
import normalizeUrl = require('normalize-url');
const ReconnectingWebSocket = require('reconnecting-websocket');


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

const express = require('express');
const Promise = require('bluebird');

class HelloWorldDataservice{
  private context: any;
  private router: Router;
  
  constructor(context: any){
    this.context = context;
    let router = express.Router();
    // var app = express();
    
    router.use(function noteRequest(req: Request,res: Response,next: any) {
      context.logger.info('Saw request, method='+req.method);
      next();
    });
    context.addBodyParseMiddleware(router);
    router.post('/',function(req: Request,res: Response) {
      //console.log("HelloWorldDataService Constructed");
      let messageFromClient = req.body ? req.body.messageFromClient : "<No/Empty Message Received from Client>"
      let responseBody = {
        "_objectType": "org.zowe.zlux.sample.service.hello",
        "_metaDataVersion": "1.0.0",
        "requestBody": req.body,
        "requestURL": req.originalUrl,
        "serverResponse": `Router received
        
        '${messageFromClient}'
        
        from client`
      }
      
      // process.on('uncaughtException', function (err: any) {
      //   console.error('Uncaught Exception: ', err.toString());
      //   if (err.stack) {
      //       console.error(err.stack);
      //   }
      // });


      res.status(200).json(responseBody);
    });
    this.router = router;

    // router.listen(3000)

  }

  getRouter():Router{
    return this.router;
  }

  createLanguageClient(connection: MessageConnection): MonacoLanguageClient {
    return new MonacoLanguageClient({
      name: "Sample Language Client",
      clientOptions: {
        // use a language id as a document selector
        documentSelector: ['python'],
        // disable the default error handler
        errorHandler: {
          error: () => ErrorAction.Continue,
          closed: () => CloseAction.DoNotRestart
        }
      },
      // create a language client connection from the JSON RPC connection on demand
      connectionProvider: {
        get: (errorHandler, closeHandler) => {
          return Promise.resolve(createConnection(connection, errorHandler, closeHandler))
        }
      }
    });
  }
  
  createUrl(path: string): string {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    return normalizeUrl(`${protocol}://${location.host}${location.pathname}${path}`);
  }
  
  createWebSocket(url: string): WebSocket {
    const socketOptions = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 10000,
      maxRetries: Infinity,
      debug: false
    };
    return new ReconnectingWebSocket(url, undefined, socketOptions);
  }
}


exports.helloWorldRouter = function(context): Router {
  return new Promise(function(resolve, reject) {
    let dataservice = new HelloWorldDataservice(context);
    resolve(dataservice.getRouter());
  });
}


/*
  This program and the accompanying materials are
  made available under the terms of the Eclipse Public License v2.0 which accompanies
  this distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
  
  SPDX-License-Identifier: EPL-2.0
  
  Copyright Contributors to the Zowe Project.
*/

