/*
* @Author: Tyler Arbon
* @Date:   2017-07-28 23:59:08
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 00:13:34
*/

'use strict';

import {RoomPlan, RoomOnePlan} from "./RoomPlans";

export class RoomManager {
	constructor() {}

	run(room: Room) {
		let plan: RoomPlan;
		if(!_.get(room, "memory.plan", null)) {
			_.set(room, "memory.plan", []);
		}
		if(!room.memory.plan[room.controller.level]){
			switch (room.controller.level) {
				case 1: {
					plan = new RoomOnePlan(room);
				}
			}

			if (plan) {
				if(plan.run()){
					room.memory.plan[room.controller.level] = true
				}
			}
		}
	}
}