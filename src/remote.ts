'use strict';

import { EventEmitter } from "events";
var Client=require("ssh2").Client;
var scpClient=require("scp2");
var fs=require("fs");
var tilde = require('tilde-expansion');

export class Remote extends EventEmitter {
	private stream;
	private sshConn;
	private ssh_ready:boolean;
	private privateKeyContent:string;
	private tmpPath:string;
	private buffer:string;
	constructor(private ssh_sever:string, private username:string, private ssh_port:number, private keypath:string, private passphrase:string,private filedir:string) {
		super();
		this.ssh_ready = false;
	}

	load():Thenable<any> {
		this.sshConn = new Client();
		return new Promise((resolve, reject) => {
			if(this.keypath) {
				new Promise((resolve, reject) => {
					tilde(this.keypath, (s:string)=> {
						resolve(s)
					})
				}).then((key_path:string) => {
					if(fs.existsSync(key_path)) {
						this.privateKeyContent = fs.readFileSync(key_path)
					}else{
						this.log("ERROR", "Cannot find ssh key path");
						this.emit("quit");
						reject();
						return;
					}
					this.log("DEBUG", this.ssh_sever + this.ssh_port+this.username +this.passphrase);
					this.sshConn.on("ready", () => {
						this.log("INFO", "Established connection.");

						this.sshConn.exec("mktemp -d", (err,stream) => {
							stream.on("data", (data)=>{
								this.tmpPath = data.toString();
							});
							stream.stderr.on("data", (err,stream) =>{
								this.log("ERROR", "Can not make a tmp file");
								this.emit("quit");
								reject();
							});
						});

						this.sshConn.exec("mktemp -d", (err, stream) => {
							if(err) {
								this.log("ERROR", "Can not exec mktemp");
								this.log("ERROR", err.toString());
								this.emit("quit");
								reject();
								return;
							}
							this.stream = stream;
							stream.on("data", (data)=>{
								this.tmpPath = data.toString().trim();
								scpClient.scp(this.filedir, {
									host: this.ssh_sever,
									username: this.username,
									privateKey: this.privateKeyContent,
									path: this.tmpPath,
									passphrase: this.passphrase
								}, (err) => {
									this.log("ERROR", "Can not send file directory "+ err) ;
									this.emit("quit")
								});
							}).stderr.on('data',(data)=>{console.log("run error "+ data)});
							stream.on("exit", (()=>{
								this.emit("quit");
								this.sshConn.end();
							}).bind(this))
						});
					}).on("error", (err) => {
							this.log("ERROR", "Can not run over ssh!");
							this.log("ERROR", err.toString());
							this.emit("quit");
							reject();
					}).connect({
							host:this.ssh_sever,
							port:this.ssh_port,
							username:this.username,
							privateKey:this.privateKeyContent,
							passphrase: this.passphrase
					});

				});
			}else{
				this.log("ERROR", "Pls set your ssh key to log server");
				this.emit("quit");
				reject();
			}
		});
	}

	log(type:string ,msg:string) {
		console.log("<"+type+">", msg)
	}

	stdout(data) {
		if(typeof data == "string") {
			this.buffer += data;
		}else{
			this.buffer += data.toString("utf8");
		}
		let end = this.buffer.lastIndexOf('\n');
		if(end != -1) {

		}
	}

	sendCommand(command:string):Thenable<any> {
		return new Promise((resolve, reject) => {

		});
	}
}