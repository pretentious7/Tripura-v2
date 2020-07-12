console.log('begin');
import Vue from 'vue/dist/vue.js';
import { Machine, interpret, send, spawn, assign, actions, forwardTo} from 'xstate';
const {log, choose} = actions;
import { authorizationMachine, appointmentMachine } from './utilityMachines.js';
import { DateTime, Interval, Duration } from 'luxon';
import { db, functions } from './firebase_setup.js';

const displayVue = new Vue({
	el : "#deetForm",
	data : {
		'doctorName' : '',
		'schedule' : {
			'date' : '',
			'timeOfAppt' : '',
			'hoursToAppt' : ''
		},
		'jitsi' : {
			'uid' : ''
		}
	}
});

const siteMachine = Machine({
	id : 'siteMachine',
	initial : 'loading',
	context : {},
	states : {
		'loading' : {
			entry : assign({
				'authUser' : () => spawn(authorizationMachine, 'authMachine')
			}),
			on : {
				'DONE' : {
					target : 'fillVue',
					actions : assign((context, event) => {
						var uid = context.authUser.state.context.uid;
						var patientDoc = db.doc(`Transactions/${uid}`).get()
						var doctorDoc = patientDoc.then((docu) => 
							db.doc(`Doctors/${docu.data().doctorID}`)
							.get())
						return {
							patientDoc : patientDoc,
							doctorDoc : doctorDoc,
							uid : uid
						}
					})
						
				}
			}
		},
		'fillVue' : {
			type : 'parallel',
			states : {
				'doctor' : {
					entry : ['fillDocName']
				},
				'apptTime' : {
					type : 'compound',
					initial : 'loading',
					states : {
						'loading': {
							entry : assign({
								'apptTime' : (context,event) => 
								spawn(appointmentMachine.
								withContext({'uid' : context.uid}), 
									'apptMachine')}),
							on: { 'UPDATE' : 'render' }
						},
						'render': {
							entry : 'fillApptTime'
						}

					}
				},
				'jitsiLink' : {
					entry : 'fillJitsiLink'
				}
			}
		}
	}
},{
	actions : {
		fillDocName : async (context, event) => { 
			var patientDoc = await context.patientDoc;
			var doctorDoc = await context.doctorDoc;
			displayVue.doctorName = doctorDoc.data().name;
		},
		fillApptTime : async (context, event) => {
			var interval = context.apptTime.state.context.interval
			var now = context.apptTime.state.context.now
			var hoursToAppt = Math.round(interval.start.diff(now,'hours', 0)
				.normalize().hours)
			displayVue.schedule = {
				date : interval.start.toISODate(),
				timeOfAppt : interval.start.toLocaleString(DateTime.TIME_SIMPLE), 
				hoursToAppt: hoursToAppt
			}
		},
		fillJitsiLink : async (context, event) => {
			displayVue.jitsi.uid = context.uid
		}
			

	}
});


var siteService = interpret(siteMachine).
	onTransition((state) => console.log(state.value)).
	start();




