import {Machine, send, sendUpdate, assign, sendParent, actions} from 'xstate';
const {log, choose} = actions;
import { transactionID }  from './globals.js';
import { db, functions, auth } from './firebase_setup.js';
import { DateTime, Interval, Duration } from 'luxon';

const createTransactionAccountPatient =
	functions.httpsCallable('authorization-createTransactionAccountPatient');

const userPromise = new Promise((resolve, reject) => {
	auth.onAuthStateChanged((user) => {
		if(user){
			resolve(user);
		} else {
			reject("no user logged in");
		}
	})
});
const authorizationMachine = Machine({
	id : 'authorizationMachine',
	initial : 'pending',
	context : {},
	states : {
		'pending' : {
			invoke : {
				id : 'loginPromise',
				src : userPromise,
				onDone : {
					target : 'authorized',
					actions : [log((_, event) => event.data.uid), 
						assign({'uid' : (_, event) => event.data.uid})]
				},
				onError : {
					target : 'loading'
				}
			}
		},
		'loading' : {
			type : 'compound',
			initial : 'getToken',
			states : {
				'getToken' : {
					invoke : {
						id : 'getTokenPromise',
						src : 
						createTransactionAccountPatient({uid : transactionID}),
						onDone : {
							target : 'signIn',
						},
						onError : {
							actions : [log('why'),log((_, event) => event)]
						}
					}
				},
				'signIn' : {
					invoke : {
						id : 'signInPromise',
						src : (context, event) => 
						auth.signInWithCustomToken(event.data.data),
						onDone : {
							target : '#authorizationMachine.authorized',
							actions : [log((_,event) => event.data.user.uid)
						,assign({'uid' : (_,event) => event.data.user.uid})]
						},
						onError : {
							actions : log((_,event) => event)
						}
					}
				}
			}
			//if no logged in, create token and return to pending
		},
		'authorized' : {
			type : 'final',
			entry : [sendUpdate(), sendParent({type : 'DONE'})],
			on : {
				'SIGNOUT' : {
					invoke : {
						id: 'signOutPromise',
						src: auth.signOut(),
						onDone : {
							target: 'pending'
						},
						onError : {
							actions : log('error signing out')
						}
					}
				}
			}
		},
	}
},{
})
const appointmentMachine = Machine({
	id : 'appointmentMachine',
	initial : 'loading',
	context : {
		'uid' : '',
		'now' : ''
	},
	states : {
		'loading' : {
			invoke : {
				id : 'schedulePromise',
				src : (context, event) => 
					db.doc(`Transactions/${context.uid}/properties/scheduleEvent`).
					get(),
				onDone : {
					target : 'time'
				},
				onError : {
					actions : log((_,event) => event)
				}
			}
		},
		'time' : {
			type : 'compound',
			initial : 'ephemeral',
			states : {
				'ephemeral' : {
					entry : [log((_, event) => event.data.data()),
						assign(
						{'interval' : 
							(_, event) => 
							Interval.fromISO(event.data.data().ISO),
						'now' : DateTime.local()
						})],
					always :[ 
							{target: 'before', cond: 'isBefore'},
							{target: 'during', cond: 'isDuring'},
							{target: 'after', cond: 'isAfter'},
					],
					exit : [sendParent('UPDATE'), sendUpdate()]
				},
				'before' : {
				},
				'during' : {
				},
				'after' : {
				}
			}
		}
	}
},{
	guards : {
		isBefore: (context, event) => context.interval.isAfter(context.now),
		isDuring: (context, event) => context.interval.contains(context.now),
		isAfter: (context, event) => context.interval.isBefore(context.now)
	}
});


export { authorizationMachine, appointmentMachine };
