/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:48:41
*/

'use strict';

import {Task, GotoRoomTask, AttackTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import * as Plans from "./../../rooms/Plans";
import * as Config from "./../../../config/config";

export class MeleeCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;

        if(!task) {

            let enemy = creep.pos.findClosestByRange<Creep>(FIND_CREEPS, {
                filter: function (creep: Creep) {
                    return _.indexOf(Config.FRIENDS, creep.owner.username) < 0;
                }
            })
            
            if (enemy) {
                task = new AttackTask(enemy);
            } else {
                let roomName;
                if(!roomName) {
                    roomName = this.getRoom(Plans.ATTACK);
                }
                if(!roomName) {
                    roomName = this.getRoom(Plans.DEFEND);
                }
                if(!roomName) {
                    roomName = this.getRoom(Plans.BASE);
                }

                if(roomName && roomName === creep.room.name) {
                    // roomName = new RoomPosition(_.random(0, 49),_.random(0, 49),creep.room.name);
                }
                if(roomName && roomName !== creep.room.name){
                    task = new GotoRoomTask(roomName);
                }
            }

            if(task) {
                console.log(creep.name,"is starting task",task.taskType);
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'red'});
    }

    protected getRoom(targetPlan: number): string {

        for (const name in Plans.rooms) {
            let x = Plans.rooms[name];
            if (x === targetPlan) {
                return name;
            }
        }

        return null;
        
    }

    static type: string = "melee";

    static createCreep(room: Room, level: number): string|number|null {
        const spawn = MeleeCreep.getSpawn(room);
        const body = MeleeCreep.getBody(room, level);
        const name = MeleeCreep.getName();
        const memory = MeleeCreep.getMemory();
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(), {
            type: MeleeCreep.type,
        });
    }

    static getName(): string {
        return MeleeCreep.type+"-"+BaseCreep.getName();
    }

    /**
     * MOVE          50
     * WORK          100
     * CARRY         50
     * ATTACK        80
     * RANGED_ATTACK 150
     * HEAL          250
     * CLAIM         600
     * TOUGH         10
     * @param  {Room}     room [description]
     * @return {string[]}      [description]
     */
    static getBody(room: Room, level: number): string[] {
        switch (level) {
            case 1: // 300
                return [ATTACK, ATTACK, MOVE, MOVE, TOUGH, TOUGH, TOUGH, TOUGH];
            case 2: // 550
            case 3: // 800
            case 4:
            default:
                return [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, TOUGH, TOUGH, TOUGH];
        }
    }
}
