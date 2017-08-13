/*
* @Author: Tyler Arbon
* @Date:   2017-08-09 17:58:52
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-11 17:29:03
*/

'use strict';

import {Serializable, SerialRaw} from "./traits";

export class Party extends Serializable {
	constructor(protected _name: string, protected _creeps: Creep[]) {
		super();
		_.set(Game, "parties."+_name, this);
	}

	goto(thing: RoomPosition | {pos: RoomPosition}) {
		return _.map(this.creeps, (creep: Creep) => {
			return creep.moveTo(thing);
		});
	}

	gotoFlag(flag: Flag) {
		return this.goto(flag);
	}

	gotoRoom(name: string) {
		return this.goto(new RoomPosition(24, 24, name));
	}

	get creeps(): Creep[] {
		return this._creeps;
	}

	get name(): string {
		return this._name;
	}

	/*==============================
	=            Memory            =
	==============================*/

	toString(): string {
		return this._name;
	}

	serialize(): SerialRaw {
		let creeps: _.List<string> = _.map(this._creeps, (c)=>c.id);

		return {
			class: "Party",
			data: {
				name: this._name,
				creeps: creeps,
			}
		}
	}

	static unserialize(x: SerialRaw): Party {
		let creeps: Creep[] = _.map(x.data.creeps, (id: string) => Game.getObjectById<Creep>(id));
		let name: string = x.data.name;
		return new Party(name, creeps);
	}

}