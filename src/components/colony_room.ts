/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-11 20:00:23
*/

'use strict';

import {ColonyCreep} from "./colony_creep";
import {Colony} from "./colony";
import {Construct} from "./construct";
import {Serializable, SerialRaw} from "./traits";

export interface IColonyRoomContents {
	updated_at: number,
	spawns: {
		my: number;
		ally: number;
		enemy: number;
	}
	creeps: {
		my: number;
		ally: number;
		enemy: number;
	}
	towers: {
		my: number;
		ally: number;
		enemy: number;
	}
	valuables: {
		source: number;
		// mineral: number;
	}
}

export class ColonyRoom extends Serializable {
	constructor(protected _name: string, protected _colony: string, protected _contents: IColonyRoomContents) {
		super();
		_.set(Game, "colony_rooms."+_name, this);
	}

	get spawns(): StructureSpawn[] {
		return this.room.find<StructureSpawn>(FIND_STRUCTURES, {filter: (s: Structure) => s.structureType === STRUCTURE_SPAWN});
	}

	get creeps(): ColonyCreep[] {
		return _.filter(Game.colony_creeps, (creep: ColonyCreep) => creep.room.name === this._name);
	}

	get room(): Room|undefined {
		return Game.rooms[this._name];
	}

	get colony(): Colony|undefined {
		return Game.colonies[this._colony];
	}

	get name(): string {
		return this._name;
	}

	run() {
		this.recordContents();

		_.forEach(this.creeps, (creep: ColonyCreep) => {
			creep.run();
		});
	}

	recordContents() {
		if(!this._contents.updated_at || this._contents.updated_at < Game.time - 50) {
			_.set(this._contents, "spawns.my", _.filter(this.spawns, {my: true}).length)
		}
	}

	spawn(construct: Construct, memory: _.Dictionary<any>): ColonyCreep {
		let spawn: Spawn = _.first<StructureSpawn>(this.room.find<Spawn>(FIND_MY_SPAWNS, {filter: (s: Spawn) => !s.spawning}));
		
		if (spawn) {
			let name = spawn.createCreep(construct.body, construct.type+"-"+_.random(9999));

			if (_.isString(name)) {
				return new ColonyCreep(name, construct.type, this._colony, this._name);
			}
			return name;
		}
	}

	hasSpawns(party: string = "my") {
		return _.get(this._contents, "spawns."+party, 0) > 0;
	}

	hasCreeps(party: string = "my") {
		return _.get(this._contents, "creeps."+party, 0) > 0;
	}

	hasTowers(party: string = "my") {
		return _.get(this._contents, "towers."+party, 0) > 0;
	}

	/*==============================
	=            Memory            =
	==============================*/

	toString(): string {
		return this._name;
	}

	serialize(): SerialRaw {
		return {
			class: "ColonyRoom",
			data: {
				name: this._name,
				colony: this._colony,
				contents: this._contents,
			}
		}
	}

	static unserialize(x: SerialRaw): ColonyRoom {
		return new ColonyRoom(x.data.name, x.data.colony, x.data.contents);
	}
}
