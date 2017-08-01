/*
* @Author: Tyler Arbon
* @Date:   2017-07-31 19:59:26
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-31 20:26:48
*/

'use strict';

import {Nest, INest} from "./Nest";
import * as Plans from "./../rooms/Plans";

export class NestManager {
	public nests: Nest[];

	constructor(memory: {[name: string]: INest}) {
		// First run
		if (!memory) {
			_.forEach(Game.rooms, (room: Room) => {
				const spawns = room.find<Spawn>(FIND_MY_SPAWNS);
				if(spawns.length) {
					let x: {[name: string]: INest} = Memory.nests || {};
					
					x[room.name] = {
						name: room.name,
						rooms: [{
							room: room.name,
							industry: Plans.BASE,
							military: Plans.BASE,
						}],
					}

					Memory.nests = x;
				}
			});
		}

		// Construct the nest instances
		for(const i in memory) {
			const option = memory[i];
			this.nests.push(new Nest(option.name, option.rooms))
		}
	}

	public run() {
		_.forEach(this.nests, (nest: Nest) => {
			nest.run();
		});
	}
}
