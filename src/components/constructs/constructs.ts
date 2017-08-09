/*
* @Author: Tyler
* @Date:   2017-08-08 22:23:12
* @Last Modified by:   Tyler
* @Last Modified time: 2017-08-08 22:59:52
*/


'use strict';

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
}