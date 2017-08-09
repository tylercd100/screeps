/*
* @Author: Tyler Arbon
* @Date:   2017-08-08 19:14:27
* @Last Modified by:   Tyler
* @Last Modified time: 2017-08-08 23:11:33
*/

'use strict';

interface Creep {
	sayHello(): void;
}

Creep.prototype.sayHello = function() {
	this.say("hello");
}
