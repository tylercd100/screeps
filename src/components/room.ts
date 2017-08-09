/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-08 19:27:19
*/

'use strict';

interface Room {
	spawn(): void;
}

Room.prototype.spawn = (body: string[], name: string, memory: _.Dictionary<any>) => {
	let spawn _.first(this.find(FIND_MY_SPAWNS, ))
	return spawn
}