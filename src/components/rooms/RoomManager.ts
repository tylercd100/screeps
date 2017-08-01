/*
* @Author: Tyler Arbon
* @Date:   2017-07-28 23:59:08
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-31 17:13:19
*/

'use strict';

import {RoomPlan, BaseRoomPlan, AttackRoomPlan, DefendRoomPlan, IgnoreRoomPlan, HarvestSourcesRoomPlan} from "./RoomPlans";
import * as Plans from "./Plans";


export class RoomManager {
	constructor() {}

	run(room: Room) {
		let plan: RoomPlan = null;
		switch(_.get<number>(Plans.rooms, room.name, Plans.IGNORE)) {
			case Plans.BASE:
				plan = new BaseRoomPlan(room);
				break;
			case Plans.ATTACK:
				plan = new AttackRoomPlan(room);
				break;
			case Plans.DEFEND:
				plan = new DefendRoomPlan(room);
				break;
			case Plans.HARVEST_SOURCES:
				plan = new HarvestSourcesRoomPlan(room);
				break;
			case Plans.IGNORE:
			default:
				plan = new IgnoreRoomPlan(room);
				break;
		}

		if(plan) {
			return plan.run();
		}
	}
}