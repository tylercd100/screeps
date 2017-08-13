/*
* @Author: Tyler Arbon
* @Date:   2017-08-10 22:14:20
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-11 19:37:07
*/

'use strict';

import {ColonyRoom} from "./colony_room";
import {Construct} from "./construct";
import {Serializable, SerialRaw} from "./traits";

export class Colony extends Serializable {
	constructor(protected _name: string, protected _crooms: ColonyRoom[]) {
		super();
		_.set(Game, "colonies."+_name, this);
	}

	get name() {
		return this._name;
	}

	get creeps() {
		return _.filter(Game.creeps, (creep) => creep.memory.colony === this.name); 
	}

	run() {
		// Build Creeps
		this.buildCreeps();
		
		// Run the Rooms
		_.forEach(this._crooms, (croom: ColonyRoom) => {
			croom.run();
		});

		// Assign Creeps
		// this.assignCreeps();

		// Run all Creeps
		// this.runCreeps();
	}

	buildCreeps() {
		const types = this.getCreepsByType();
		if (_.get(types, "worker.length", 0) < 5) {
			const c = Construct.make("worker", 1);
			if(c) {
				this.spawn(c);
			}
		}
	}

	/*===============================
	=            Utility            =
	===============================*/

	spawn(construct: Construct, memory: _.Dictionary<any> = {}) {
		let rooms = this.getRoomsWithMySpawns();
		let room = _.first(rooms);
		if(room) {
			return room.spawn(construct, _.merge({
				colony: this._name
			}, memory));
		} else {
			return ERR_NOT_FOUND;
		}
	}

	getMySpawns(): Spawn[] {
		let rooms: ColonyRoom[] = this.getRoomsWithMySpawns();
		return _(rooms).map<Spawn[]>((room: ColonyRoom) => room.spawns).flatten<Spawn>().value();
	}

	getRoomsWithMySpawns(): ColonyRoom[] {
		return _.filter(this._crooms, (r: ColonyRoom) => r.hasSpawns("my"))
	}

	getCreepsByType() {
		return _.groupBy(this.creeps, (creep) => creep.memory.type); 
	}

	/*==============================
	=            Memory            =
	==============================*/

	toString(): string {
		return this._name;
	}

	serialize(): SerialRaw {
		return {
			class: "Colony",
			data: {
				_name: this._name,
				_crooms: _.map(this._crooms, (c) => c.toString()),
			}
		}
	}

	static unserialize(x: SerialRaw): Colony {
		return new Colony(x.data._name, _.map(x.data._crooms, (name: string) => Game.colony_rooms[name]));
	}
}