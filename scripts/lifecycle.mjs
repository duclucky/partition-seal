import {runPayments} from './payments.mjs';
import {reportError} from './network.mjs';
runPayments('sale').catch(reportError);
