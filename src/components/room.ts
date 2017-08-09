/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler
* @Last Modified time: 2017-08-08 23:03:31
*/

'use strict';

import {Construct} from "./constructs/constructs";

declare global {
	interface Room {
		spawn(): void;
	}
}

Room.prototype.spawn = function(construct: Construct, memory: _.Dictionary<any> = {}) {
	let spawn: StructureSpawn = _.first<StructureSpawn>(this.find(FIND_MY_SPAWNS, (s: Spawn) => !s.spawning));
	return spawn.createCreep(construct.body, construct.type+"-"+_.random(9999), _.merge({type: construct.type}, memory));
}
