/*
* @Author: Tyler
* @Date:   2017-08-08 22:23:12
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-11 18:26:05
*/


'use strict';

const BLUEPRINT = {
	worker: [
		[WORK, CARRY, CARRY, MOVE, MOVE],
	]
}

export class Construct {
	constructor(protected _body: string[], protected _type: string) {}

	get type(): string {
		return this._type;
	}

	get body(): string[] {
		return this._body;
	}

	get cost(): number {
	    return this.calcBodyCost(this.body);
	}

    protected calcBodyCost(body: string[]) {
    	return _(body).map((b) => BODYPART_COST[b]).sum();
    }

    static make(type: string, level: number): Construct|undefined {
    	const body: string[] = BLUEPRINT[type][level-1];
    	return _.isArray(body) && !_.isEmpty(body) ? new Construct(body, type) : undefined;
    }
}