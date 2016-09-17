'use strict';

import { DebugSession, InitializedEvent, TerminatedEvent, StoppedEvent, OutputEvent, Thread, StackFrame, Scope, Source, Handles } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import {Remote} from "./remote";

export class bashBasicDebugSession extends DebugSession {
	protected threadID: number = 1;

	// since we want to send breakpoint events, we will assign an id to every event
	// so that the frontend can match events with breakpoints.
	private _breakpointId = 1000;

	// This is the next line that will be 'executed'
	private __currentLine = 0;
	private get _currentLine() : number {
		return this.__currentLine;
    }
	private set _currentLine(line: number) {
		this.__currentLine = line;
		this.sendEvent(new OutputEvent(`line: ${line}\n`));	// print current line on debug console
	}

	// the initial (and one and only) file we are 'debugging'
	private _sourceFile: string;

	// the contents (= lines) of the one and only file
	private _sourceLines = new Array<string>();

	// maps from sourceFile to array of Breakpoints
	private _breakPoints = new Map<string, DebugProtocol.Breakpoint[]>();

	private _variableHandles = new Handles<string>();

	protected _timer;
	protected buffer;

	protected remote_server:Remote;

	public constructor(debuggerLineStartAt1:boolean, isServer: boolean = false, threadID:number = 1) {
		super(debuggerLineStartAt1, isServer);
		this.threadID = threadID;
	}

	public initDebugger() {
		this.remote_server.on("quit", ()=>{console.log("quit")});
	}

}
