<template>
	<div id="billdetail" class="app-content-details">
		<h2 class="bill-title">
			<span v-show="billLoading" class="loading-bill icon-loading-small" />
			<div :class="'billFormAvatar owerAvatar' + myGetAvatarClass(bill.payer_id)">
				<div class="disabledMask" /><img :src="myGetTitleAvatar(bill.payer_id)">
			</div>
			<span>
				{{ billFormattedTitle }}
			</span>
			<a v-for="link in billLinks"
				:key="link"
				:href="link"
				target="blank">
				[🔗 {{ t('cospend', 'link') }}]
			</a>
			<button
				v-if="isNewBill"
				id="owerValidate"
				style="display: inline-block;"
				:title="t('cospend', 'Press Shift+Enter to validate')"
				@click="onCreateClick">
				<span class="icon-confirm" />
				<span id="owerValidateText">
					{{ createBillButtonText }}
				</span>
			</button>
		</h2>
		<div class="bill-form">
			<div class="bill-left">
				<div class="bill-what">
					<label for="what">
						<a class="icon icon-tag" />{{ t('cospend', 'What?') }}
					</label>
					<input
						id="what"
						v-model="bill.what"
						type="text"
						maxlength="300"
						class="input-bill-what"
						:readonly="!editionAccess"
						:placeholder="t('cospend', 'What is the bill about?')"
						@input="onBillEdited"
						@focus="$event.target.select()">
				</div>
				<div v-if="!pageIsPublic"
					class="bill-link-button">
					<div />
					<button id="addFileLinkButton" @click="onGeneratePubLinkClick">
						<span class="icon-public" />{{ t('cospend', 'Attach public link to personal file') }}
					</button>
				</div>
				<div class="bill-amount">
					<label for="amount">
						<a class="icon icon-cospend" />{{ t('cospend', 'How much?') }}
					</label>
					<div class="field-with-info">
						<input
							id="amount"
							v-model="uiAmount"
							type="text"
							class="input-bill-amount"
							:disabled="isNewBill && newBillMode === 'custom'"
							:readonly="!editionAccess"
							@input="onAmountChanged"
							@keyup.enter="onAmountEnterPressed"
							@focus="$event.target.select()">
						<button class="icon-info infoButton" @click="onAmountInfoClicked" />
					</div>
				</div>
				<div
					v-if="project.currencyname && project.currencies.length > 0 && editionAccess"
					class="bill-currency-convert">
					<label for="bill-currency">
						<a class="icon icon-currencies" />{{ t('cospend', 'Convert to') }}
					</label>
					<div class="field-with-info">
						<select id="bill-currency" ref="currencySelect" @change="onCurrencyConvert">
							<option value="">
								{{ project.currencyname }}
							</option>
							<option v-for="currency in project.currencies"
								:key="currency.id"
								:value="currency.id">
								{{ currency.name }} ⇒ {{ project.currencyname }} (x{{ currency.exchange_rate }})
							</option>
						</select>
						<button class="icon-info infoButton" @click="onConvertInfoClicked" />
					</div>
				</div>
				<div class="bill-payer">
					<label for="payer"><a class="icon icon-user" />{{ t('cospend', 'Who payed?') }}</label>
					<select
						id="payer"
						v-model="bill.payer_id"
						class="input-bill-payer"
						:disabled="!editionAccess || (!isNewBill && !members[bill.payer_id].activated)"
						@input="onBillEdited">
						<option v-for="member in activatedOrPayer"
							:key="member.id"
							:value="member.id"
							:selected="member.id === bill.payer_id || (isNewBill && currentUser && member.userid === currentUser.uid)">
							{{ myGetSmartMemberName(member.id) }}
						</option>
					</select>
				</div>
				<div class="bill-date">
					<label for="date"><a class="icon icon-calendar-dark" />{{ t('cospend', 'When?') }}</label>
					<DatetimePicker v-model="billDatetime"
						class="datetime-picker"
						type="datetime"
						:placeholder="t('cospend', 'When?')"
						:minute-step="5"
						:show-second="false"
						:format="format"
						:disabled="!editionAccess"
						confirm />
				</div>
				<div class="bill-payment-mode">
					<label for="payment-mode">
						<a class="icon icon-tag" />{{ t('cospend', 'Payment mode') }}
					</label>
					<select
						id="payment-mode"
						v-model="bill.paymentmode"
						:disabled="!editionAccess"
						@input="onBillEdited">
						<option value="n">
							{{ t('cospend', 'None') }}
						</option>
						<option
							v-for="(pm, id) in paymentModes"
							:key="id"
							:value="id">
							{{ pm.icon + ' ' + pm.name }}
						</option>
					</select>
				</div>
				<div class="bill-category">
					<label for="category">
						<a class="icon icon-category-app-bundles" />{{ t('cospend', 'Category') }}
					</label>
					<select
						id="category"
						v-model="bill.categoryid"
						:disabled="!editionAccess"
						@input="onBillEdited">
						<option value="0">
							{{ t('cospend', 'None') }}
						</option>
						<option
							v-for="category in categories"
							:key="category.id"
							:value="category.id">
							{{ category.icon + ' ' + category.name }}
						</option>
						<option
							v-for="(category, catid) in hardCodedCategories"
							:key="catid"
							:value="catid">
							{{ category.icon + ' ' + category.name }}
						</option>
					</select>
				</div>
				<div class="bill-comment">
					<label for="comment">
						<a class="icon icon-comment" />{{ t('cospend', 'Comment') }}
					</label>
					<textarea
						id="comment"
						v-model="bill.comment"
						maxlength="300"
						class="input-bill-comment"
						:readonly="!editionAccess"
						:placeholder="t('cospend', 'More details about the bill (300 char. max)')"
						@input="onBillEdited" />
				</div>
				<div class="bill-repeat">
					<label for="repeatbill">
						<a class="icon icon-play-next" />{{ t('cospend', 'Repeat') }}
					</label>
					<select
						id="repeatbill"
						v-model="bill.repeat"
						:disabled="!editionAccess"
						@input="onBillEdited">
						<option value="n" selected="selected">
							{{ t('cospend', 'No') }}
						</option>
						<option value="d">
							{{ t('cospend', 'Daily') }}
						</option>
						<option value="w">
							{{ t('cospend', 'Weekly') }}
						</option>
						<option value="m">
							{{ t('cospend', 'Monthly') }}
						</option>
						<option value="y">
							{{ t('cospend', 'Yearly') }}
						</option>
					</select>
				</div>
				<div
					v-if="bill.repeat !== 'n'"
					class="bill-repeat-extra">
					<div class="bill-repeat-include">
						<input
							id="repeatallactive"
							v-model="bill.repeatallactive"
							class="checkbox"
							type="checkbox"
							:disabled="!editionAccess"
							@input="onBillEdited">
						<label for="repeatallactive" class="checkboxlabel">
							{{ t('cospend', 'Include all active members on repeat') }}
						</label>
						<br>
					</div>
					<div class="bill-repeat-until">
						<label for="repeatuntil">
							<a class="icon icon-pause" />{{ t('cospend', 'Repeat until') }}
						</label>
						<input
							id="repeatuntil"
							v-model="bill.repeatuntil"
							type="date"
							class="input-bill-repeatuntil"
							:readonly="!editionAccess"
							@input="onBillEdited">
					</div>
				</div>
			</div>
			<div class="bill-right">
				<div v-if="isNewBill"
					class="bill-type">
					<label class="bill-owers-label">
						<a class="icon icon-toggle-filelist" /><span>{{ t('cospend', 'Bill type') }}</span>
					</label><br>
					<select
						id="billtype"
						v-model="newBillMode">
						<option value="normal" :selected="true">
							{{ t('cospend', 'Classic, even split') }}
						</option>
						<option value="perso">
							{{ t('cospend', 'Even split with optional personal parts') }}
						</option>
						<option value="custom">
							{{ t('cospend', 'Custom owed amount per member') }}
						</option>
					</select>
					<button id="modehintbutton" @click="onHintClick">
						<span class="icon-details" />
					</button>
					<transition name="fade">
						<div v-if="newBillMode === 'normal' && showHint"
							class="modehint modenormal">
							{{ t('cospend', 'Classic mode: Choose a payer, enter a bill amount and select who is concerned by the whole spending, the bill is then split equitably between selected members. Real life example: One person pays the whole restaurant bill and everybody agrees to evenly split the cost.') }}
						</div>
						<div v-else-if="newBillMode === 'perso' && showHint"
							class="modehint modeperso">
							{{ t('cospend', 'Classic+personal mode: This mode is similar to the classic one. Choose a payer and enter a bill amount corresponding to what was actually payed. Then select who is concerned by the bill and optionally set an amount related to personal stuff for some members. Multiple bills will be created: one for the shared spending and one for each personal part. Real life example: We go shopping, part of what was bought concerns the group but someone also added something personal (like a shirt) which the others don\'t want to collectively pay.') }}
						</div>
						<div v-else-if="newBillMode === 'custom' && showHint"
							class="modehint modecustom">
							{{ t('cospend', 'Custom mode, uneven split: Choose a payer, ignore the bill amount (which is disabled) and enter a custom owed amount for each member who is concerned. Then press "Create the bills". Multiple bills will be created. Real life example: One person pays the whole restaurant bill but there are big price differences between what each person ate.') }}
						</div>
					</transition>
				</div>
				<div class="bill-owers">
					<label class="bill-owers-label">
						<a class="icon icon-group" /><span>{{ t('cospend', 'For whom?') }}</span>
					</label>
					<div v-if="newBillMode !== 'custom'"
						class="owerAllNoneDiv">
						<div class="icon-group" />
						<input
							id="checkAllNone"
							v-model="selectAllNoneOwers"
							type="checkbox"
							class="checkbox"
							:disabled="!editionAccess"
							@input="onBillEdited">
						<label for="checkAllNone" class="checkboxlabel">{{ t('cospend', 'All/None') }}</label>
					</div>
					<div v-if="newBillMode === 'normal'">
						<div v-for="ower in activatedOrOwer"
							:key="ower.id"
							class="owerEntry">
							<div :class="'owerAvatar' + myGetAvatarClass(ower.id)">
								<div class="disabledMask" /><img :src="myGetMemberAvatar(ower.id)">
							</div>
							<input
								:id="'dum' + ower.id"
								v-model="bill.owerIds"
								:value="ower.id"
								number
								class="checkbox"
								type="checkbox"
								:owerid="ower.id"
								:disabled="!editionAccess || !members[ower.id].activated"
								@input="onBillEdited">
							<label
								class="checkboxlabel"
								:for="'dum' + ower.id">
								{{ ower.name }}
							</label>
							<label v-if="bill.owerIds.includes(ower.id)"
								class="spentlabel">
								({{ owerAmount[ower.id] || 0 }})
							</label>
						</div>
					</div>
					<div v-else-if="newBillMode === 'perso'">
						<div v-for="ower in activatedOrOwer"
							:key="ower.id"
							class="owerEntry">
							<div :class="'owerAvatar' + myGetAvatarClass(ower.id)">
								<div class="disabledMask" /><img :src="myGetMemberAvatar(ower.id)">
							</div>
							<input
								:id="'dum' + ower.id"
								v-model="bill.owerIds"
								class="checkbox"
								type="checkbox"
								:owerid="ower.id"
								:value="ower.id"
								number>
							<label
								class="checkboxlabel"
								:for="'dum' + ower.id">
								{{ ower.name }}
							</label>
							<input v-show="bill.owerIds.includes(ower.id)"
								:ref="'amountdum' + ower.id"
								class="amountinput"
								type="text"
								value=""
								:placeholder="t('cospend', 'Personal amount')"
								@keyup.enter="onPersoAmountEnterPressed">
						</div>
					</div>
					<div v-else>
						<div v-for="ower in activatedOrOwer"
							:key="ower.id"
							class="owerEntry">
							<div :class="'owerAvatar' + myGetAvatarClass(ower.id)">
								<div class="disabledMask" /><img :src="myGetMemberAvatar(ower.id)">
							</div>
							<label
								class="numberlabel"
								:for="'amountdum' + ower.id">
								{{ ower.name }}
							</label>
							<input
								:id="'amountdum' + ower.id"
								:ref="'amountdum' + ower.id"
								class="amountinput"
								type="text"
								value=""
								:placeholder="t('cospend', 'Custom amount')"
								@input="onCustomAmountChange"
								@keyup.enter="onCustomAmountEnterPressed">
						</div>
					</div>
				</div>
				<button
					v-if="isNewBill"
					id="owerValidate2"
					:title="t('cospend', 'Press Shift+Enter to validate')"
					@click="onCreateClick">
					<span class="icon-confirm" />
					<span id="owerValidateText">{{ createBillButtonText }}</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import cospend from './state'
import { generateUrl } from '@nextcloud/router'
import { getCurrentUser } from '@nextcloud/auth'
import { getLocale } from '@nextcloud/l10n'
import DatetimePicker from '@nextcloud/vue/dist/Components/DatetimePicker'
import {
	showSuccess,
	showError,
} from '@nextcloud/dialogs'
import moment from '@nextcloud/moment'
import {
	delay, getCategory, getSmartMemberName, getMemberAvatar,
} from './utils'
import * as network from './network'

export default {
	name: 'BillForm',

	components: {
		DatetimePicker,
	},

	props: {
		bill: {
			type: Object,
			required: true,
		},
		members: {
			type: Object,
			required: true,
		},
		editionAccess: {
			type: Boolean,
			required: true,
		},
	},
	data() {
		return {
			projectId: cospend.currentProjectId,
			currentUser: getCurrentUser(),
			newBillMode: 'normal',
			billLoading: false,
			progAmountChange: false,
			showHint: false,
			locale: getLocale(),
			format: {
				stringify: this.stringify,
				parse: this.parse,
			},
			currentFormula: null,
			nbBillsLeftToCreate: 0,
		}
	},

	computed: {
		// amount field proxy to safely manipulate bill.amount
		uiAmount: {
			get() {
				return this.bill.amount
			},
			set(value) {
				const val = value.replace(/,/g, '.')
				// only change bill amount if we're not typing a formula
				if (val === '') {
					this.bill.amount = 0
					this.currentFormula = null
				} else if (!val.endsWith('.') && !isNaN(val)) {
					this.bill.amount = parseFloat(val)
					this.currentFormula = null
				} else {
					this.currentFormula = val
				}
			},
		},
		selectAllNoneOwers: {
			get() {
				return this.activatedOrOwer ? this.bill.owerIds.length === this.activatedOrOwer.length : false
			},
			set(value) {
				const that = this
				const selected = []

				if (value) {
					// select all members
					this.activatedOrOwer.forEach((member) => {
						selected.push(member.id)
					})
				} else {
					// deselect all members
					// avoid deselecting disabled ones (add those who are not active and were selected)
					this.disabledMembers.forEach((member) => {
						if (that.bill.owerIds.includes(member.id)) {
							selected.push(member.id)
						}
					})
				}

				this.bill.owerIds = selected
			},
		},
		owerAmount() {
			const result = {}
			const that = this
			const amount = parseFloat(this.bill.amount)
			const nbOwers = this.bill.owerIds.length
			let weightSum = 0
			let oneWeight, owerVal
			if (nbOwers > 0
				&& !isNaN(amount)
				&& amount !== 0.0) {
				this.bill.owerIds.forEach(function(mid) {
					weightSum += that.members[mid].weight
				})
				oneWeight = amount / weightSum
				this.bill.owerIds.forEach(function(mid) {
					owerVal = oneWeight * that.members[mid].weight
					result[mid] = owerVal.toFixed(2)
				})
			}
			return result
		},
		pageIsPublic() {
			return cospend.pageIsPublic
		},
		isNewBill() {
			return (this.bill.id === 0)
		},
		noBill() {
			return (this.bill && this.bill.id === -1)
		},
		project() {
			return cospend.projects[this.projectId]
		},
		billLinks() {
			return this.bill.what.match(/https?:\/\/[^\s]+/gi) || []
		},
		billFormattedTitle() {
			let paymentmodeChar = ''
			let categoryChar = ''
			if (parseInt(this.bill.categoryid) !== 0) {
				categoryChar = getCategory(this.projectId, this.bill.categoryid).icon + ' '
			}
			if (this.bill.paymentmode && this.bill.paymentmode !== 'n') {
				paymentmodeChar = cospend.paymentModes[this.bill.paymentmode].icon + ' '
			}
			const whatFormatted = paymentmodeChar + categoryChar + this.bill.what.replace(/https?:\/\/[^\s]+/gi, '')
			return t('cospend', 'Bill : {what}', { what: whatFormatted })
		},
		billDateObject() {
			return moment.unix(this.bill.timestamp).toDate()
		},
		billDatetime: {
			get() {
				return this.billDateObject
			},
			set(value) {
				const ts = moment(value).unix()
				if (!isNaN(ts)) {
					this.bill.timestamp = ts
					this.onBillEdited(null, false)
				}
			},
		},
		activatedMembers() {
			const mList = []
			for (const mid in this.members) {
				if (this.members[mid].activated) {
					mList.push(this.members[mid])
				}
			}
			return mList
		},
		disabledMembers() {
			const mList = []
			for (const mid in this.members) {
				if (!this.members[mid].activated) {
					mList.push(this.members[mid])
				}
			}
			return mList
		},
		activatedOrPayer() {
			const mList = []
			for (const mid in this.members) {
				if (this.members[mid].activated || parseInt(mid) === this.bill.payer_id) {
					mList.push(this.members[mid])
				}
			}
			return mList
		},
		activatedOrOwer() {
			const mList = []
			for (const mid in this.members) {
				if (this.members[mid].activated || this.bill.owerIds.indexOf(parseInt(mid)) !== -1) {
					mList.push(this.members[mid])
				}
			}
			return mList
		},
		categories() {
			return cospend.projects[this.projectId].categories
		},
		hardCodedCategories() {
			return cospend.hardCodedCategories
		},
		currencies() {
			return cospend.projects[this.projectId].currencies
		},
		paymentModes() {
			return cospend.paymentModes
		},
		createBillButtonText() {
			return this.newBillMode === 'normal' ? t('cospend', 'Create the bill') : t('cospend', 'Create the bills')
		},
	},

	watch: {
		bill() {
			// reset formula when changing bill
			this.currentFormula = null
		},
	},

	methods: {
		stringify(date) {
			return moment(date).locale(this.locale).format('LLL')
		},
		parse(value) {
			return moment(value, 'LLL', this.locale).toDate()
		},
		myGetSmartMemberName(mid) {
			let smartName = getSmartMemberName(this.projectId, mid)
			if (smartName === t('cospend', 'You')) {
				smartName += ' (' + this.members[mid].name + ')'
			}
			return smartName
		},
		myGetAvatarClass(mid) {
			return this.members[mid].activated ? '' : ' owerAvatarDisabled'
		},
		myGetTitleAvatar(mid) {
			return (this.bill.id === 0)
				? generateUrl('/apps/cospend/getAvatar?name=' + encodeURIComponent('*'))
				: this.myGetMemberAvatar(mid)
		},
		myGetMemberAvatar(mid) {
			return getMemberAvatar(this.projectId, mid)
		},
		myGetMemberColor(mid) {
			if (mid === 0) {
				return '888888'
			} else {
				return this.members[mid].color
			}
		},
		onBillEdited(e, delayed = true) {
			const that = this
			if (!this.isNewBill && !this.noBill) {
				if (delayed) {
					delay(function() {
						that.saveBill()
					}, 2000)()
				} else {
					this.saveBill()
				}
			}
		},
		isBillValidForSaveOrNormal() {
			return this.basicBillValueCheck() && this.bill.owerIds.length > 0
		},
		basicBillValueCheck() {
			const bill = this.bill
			if (bill.what === null || bill.what === '') {
				return false
			}
			if (bill.amount === '' || isNaN(bill.amount) || isNaN(bill.payer_id)) {
				return false
			}
			return true
		},
		saveBill() {
			// don't save the bill if we are typing a formula
			if (this.currentFormula !== null) {
				return
			}
			if (!this.isBillValidForSaveOrNormal()) {
				showError(t('cospend', 'Impossible to save bill, invalid values.'))
			} else {
				this.billLoading = true
				const bill = this.bill
				network.saveBill(this.projectId, bill, this.saveBillSuccess, this.saveBillDone)
			}
		},
		saveBillSuccess() {
			// to update balances
			this.$emit('billSaved', this.bill)
			showSuccess(t('cospend', 'Bill saved.'))
		},
		saveBillDone() {
			this.billLoading = false
		},
		onCurrencyConvert() {
			let currencyId = this.$refs.currencySelect.value
			if (currencyId !== '') {
				const userAmount = parseFloat(this.bill.amount)
				currencyId = parseInt(currencyId)
				let currency = null
				for (let i = 0; i < this.currencies.length; i++) {
					if (parseInt(this.currencies[i].id) === currencyId) {
						currency = this.currencies[i]
						break
					}
				}
				this.progAmountChange = true
				this.bill.amount = parseFloat(this.bill.amount) * currency.exchange_rate
				this.bill.what = this.cleanStringFromCurrency(this.bill.what) + ' (' + userAmount.toFixed(2) + ' ' + currency.name + ')'
				this.$refs.currencySelect.value = ''
				// convert personal amounts
				if (this.isNewBill && this.newBillMode === 'perso') {
					const persoParts = this.getPersonalParts()
					let part
					for (const mid in persoParts) {
						part = persoParts[mid]
						if (part !== 0.0) {
							this.$refs['amountdum' + mid][0].value = part * currency.exchange_rate
						}
					}
				}
				if (this.isNewBill && this.newBillMode === 'custom') {
					const customAmounts = this.getCustomAmounts()
					let am
					for (const mid in customAmounts) {
						am = customAmounts[mid]
						if (am !== 0.0) {
							this.$refs['amountdum' + mid][0].value = am * currency.exchange_rate
						}
					}
				}
				this.onBillEdited(null, false)
			}
		},
		cleanStringFromCurrency(str) {
			let currency, re
			for (let i = 0; i < this.currencies.length; i++) {
				currency = this.currencies[i]
				re = new RegExp(' \\(\\d+\\.?\\d* ' + currency.name + '\\)', 'g')
				str = str.replace(re, '')
			}
			return str
		},
		onAmountChanged() {
			this.bill.what = this.cleanStringFromCurrency(this.bill.what)
			// here, do nothing if we are typing a formula or if
			if (this.currentFormula === null) {
				this.onBillEdited()
			}
		},
		onAmountEnterPressed() {
			// try to evaluate the current algebric formula
			if (isNaN(this.currentFormula)) {
				let calc = 'a'
				try {
					// eslint-disable-next-line
					calc = eval(this.currentFormula)
				} catch (err) {
					console.debug(err)
				}
				this.bill.amount = isNaN(calc) ? 0 : calc
				this.currentFormula = null
				this.onBillEdited(null, false)
			}
		},
		onPersoAmountEnterPressed(e) {
			const val = e.target.value.replace(/,/g, '.')
			if (isNaN(val)) {
				let calc = 'a'
				try {
					// eslint-disable-next-line
					calc = eval(val)
				} catch (err) {
					console.debug(err)
				}
				if (!isNaN(calc)) {
					e.target.value = calc
				}
			}
		},
		onCustomAmountEnterPressed(e) {
			const val = e.target.value.replace(/,/g, '.')
			if (isNaN(val)) {
				let calc = 'a'
				try {
					// eslint-disable-next-line
					calc = eval(val)
				} catch (err) {
					console.debug(err)
				}
				if (!isNaN(calc)) {
					e.target.value = calc
					this.onCustomAmountChange()
				}
			}
		},
		onHintClick() {
			this.showHint = !this.showHint
		},
		onCreateClick() {
			if (this.newBillMode === 'normal') {
				this.createNormalBill()
			} else if (this.newBillMode === 'perso') {
				this.createEquiPersoBill()
			} else if (this.newBillMode === 'custom') {
				this.createCustomAmountBill()
			}
		},
		createNormalBill() {
			if (this.isBillValidForSaveOrNormal()) {
				const bill = this.bill
				this.createBill('normal', bill.what, bill.amount, bill.payer_id, bill.timestamp, bill.owerIds, bill.repeat,
					bill.paymentmode, bill.categoryid, bill.repeatallactive, bill.repeatuntil, bill.comment)
			} else {
				showError(t('cospend', 'Bill values are not valid.'))
			}
		},
		createEquiPersoBill() {
			if (this.isBillValidForSaveOrNormal()) {
				const bill = this.bill
				// check if personal parts are valid
				let tmpAmount = parseFloat(this.bill.amount)
				const persoParts = this.getPersonalParts()
				let part
				for (const mid in persoParts) {
					part = persoParts[mid]
					if (!isNaN(part) && part > 0.0) {
						tmpAmount -= part
					}
				}
				if (tmpAmount < 0.0) {
					showError(t('cospend', 'Personal parts are bigger than the paid amount.'))
					return
				}

				// count how many bills are going to be created
				let nbBills = 0
				for (const mid in persoParts) {
					part = persoParts[mid]
					if (!isNaN(part) && part !== 0.0) {
						nbBills++
					}
				}
				if (tmpAmount > 0.0) {
					nbBills++
				}
				this.nbBillsLeftToCreate = nbBills

				// create bills for perso parts
				for (const mid in persoParts) {
					part = persoParts[mid]
					if (!isNaN(part) && part !== 0.0) {
						this.createBill('perso', bill.what, part, bill.payer_id, bill.timestamp, [mid], bill.repeat,
							bill.paymentmode, bill.categoryid, bill.repeatallactive, bill.repeatuntil, bill.comment)
					}
				}

				// create main bill
				if (tmpAmount > 0.0) {
					this.createBill('mainPerso', bill.what, tmpAmount, bill.payer_id, bill.timestamp, bill.owerIds, bill.repeat,
						bill.paymentmode, bill.categoryid, bill.repeatallactive, bill.repeatuntil, bill.comment)
				}
				this.newBillMode = 'normal'
			} else {
				showError(t('cospend', 'Bill values are not valid.'))
			}
		},
		createCustomAmountBill() {
			if (this.basicBillValueCheck()) {
				const bill = this.bill
				// check if custom amounts are valid
				const customAmounts = this.getCustomAmounts()
				let total = 0.0
				let nbBills = 0
				for (const mid in customAmounts) {
					total += customAmounts[mid]
					// count how many bills are going to be created
					if (customAmounts[mid] !== 0.0) {
						nbBills++
					}
				}
				if (total === 0.0) {
					showError(t('cospend', 'There is no custom amount.'))
					return
				} else {
					this.nbBillsLeftToCreate = nbBills
					let am
					for (const mid in customAmounts) {
						am = customAmounts[mid]
						if (am !== 0.0) {
							this.createBill('custom', bill.what, am, bill.payer_id, bill.timestamp, [mid], bill.repeat,
								bill.paymentmode, bill.categoryid, bill.repeatallactive, bill.repeatuntil, bill.comment)
						}
					}
				}
				this.newBillMode = 'normal'
			} else {
				showError(t('cospend', 'Bill values are not valid.'))
			}
		},
		createBill(mode = null, what = null, amount = null, payer_id = null, timestamp = null, owerIds = null, repeat = null,
			paymentmode = null, categoryid = null, repeatallactive = null,
			repeatuntil = null, comment = null) {
			const that = this
			if (mode === null) {
				mode = that.newBillMode
			}
			const billToCreate = {
				what,
				comment,
				timestamp,
				payer_id,
				owerIds,
				amount,
				repeat,
				repeatallactive,
				repeatuntil,
				paymentmode,
				categoryid,
			}
			const req = {
				what,
				comment,
				timestamp,
				payer: payer_id,
				payed_for: owerIds.join(','),
				amount,
				repeat,
				repeatallactive: repeatallactive ? 1 : 0,
				repeatuntil,
				paymentmode,
				categoryid,
			}
			this.billLoading = true
			network.createBill(this.projectId, mode, req, billToCreate, this.createBillSuccess, this.createBillDone)
		},
		createBillSuccess(response, billToCreate, mode) {
			const billid = response
			billToCreate.id = billid
			// only select the bill if it's a normal one or the main one in perso mode
			const select = (mode === 'normal' || mode === 'mainPerso')
			this.$emit('billCreated', billToCreate, select, mode)
			showSuccess(t('cospend', 'Bill created.'))
			// manage multiple creation
			if (mode !== 'normal') {
				this.nbBillsLeftToCreate--
				if (this.nbBillsLeftToCreate === 0) {
					if (mode === 'custom') {
						this.$emit('customBillsCreated')
					} else {
						this.$emit('persoBillsCreated')
					}
				}
			}
		},
		createBillDone() {
			this.billLoading = false
		},
		getPersonalParts() {
			const result = {}
			const that = this
			this.bill.owerIds.forEach((mid) => {
				result[mid] = parseFloat(that.$refs['amountdum' + mid][0].value) || 0
			})
			return result
		},
		getCustomAmounts() {
			const result = {}
			const that = this
			this.activatedOrOwer.forEach((member) => {
				result[member.id] = parseFloat(that.$refs['amountdum' + member.id][0].value) || 0
			})
			return result
		},
		onCustomAmountChange() {
			const customAmounts = this.getCustomAmounts()
			let am
			let sum = 0
			for (const mid in customAmounts) {
				am = customAmounts[mid]
				sum += am
			}
			this.bill.amount = sum
		},
		onGeneratePubLinkClick() {
			const that = this
			OC.dialogs.filepicker(
				t('cospend', 'Choose file'),
				function(targetPath) {
					that.generatePublicLinkToFile(targetPath)
				},
				false, null, true
			)
		},
		generatePublicLinkToFile(targetPath) {
			network.generatePublicLinkToFile(targetPath, this.genSuccess)
		},
		genSuccess(response) {
			const filePublicUrl = window.location.protocol + '//' + window.location.host + generateUrl('/s/' + response.token)

			let what = this.bill.what
			what = what + ' ' + filePublicUrl
			this.bill.what = what
			this.onBillEdited()
		},
		onConvertInfoClicked() {
			OC.dialogs.info(
				t('cospend', 'This is just a currency converter. Bill amount can be entered in another currency and then converted to "{maincur}". Value is always stored in "{maincur}".', { maincur: this.project.currencyname }),
				t('cospend', 'Info')
			)
		},
		onAmountInfoClicked() {
			OC.dialogs.info(
				t('cospend', 'You can type simple math operations and validate by pressing Enter key.'),
				t('cospend', 'Info')
			)
		},
	},
}
</script>

<style scoped lang="scss">
.bill-left select,
.bill-left textarea,
.bill-left input {
	width: 100%;
}

.bill-form a.icon {
	justify-content: space-between;
	line-height: 44px;
	min-height: 44px;
	padding: 0 12px 0 25px;
}

.bill-left,
.bill-right {
	padding: 0px 10px 0px 15px;
	float: left;
}

.owerAllNoneDiv label,
.owerEntry label {
	margin-left: 5px;
}

.bill-owers input {
	cursor: pointer;
	padding: 5px;
	min-height: 0px;
}

#owerValidate,
#owerValidate2 {
	background-color: #46ba61;
	color: white;
}

.owerAllNoneDiv div {
	display: inline-block;
	width: 24px;
}

.owerAllNoneDiv,
.owerEntry {
	margin-left: 26px;
	margin-right: 00px;
	margin-top: 15px;
	margin-bottom: 15px;
}

.amountinput {
	margin-top: 0px !important;
	margin-bottom: 0px !important;
}

.bill-title {
	text-align: left;
	margin-left: 50px;
}

#billtype {
	max-width: 80%;
}

.billFormAvatar img {
	width: 50px;
}

.billFormAvatar .disabledMask {
	width: 52px;
	height: 52px;
	left: 51px;
}

.infoButton {
	height: 34px;
	width: 34px;
	float: right;
}

.field-with-info {
	display: flex;
}

.field-with-info select,
.field-with-info input {
	flex-grow: 100;
}

.datetime-picker {
	width: 100%;
}

.bill-date,
.bill-payment-mode,
.bill-category,
.bill-repeat,
.bill-repeat-until,
.bill-payer,
.bill-amount,
.bill-currency-convert,
.bill-comment,
.bill-link-button,
.bill-what {
	display: grid;
	grid-template: 1fr / 5fr 7fr;
}

.bill-repeat,
.bill-payer,
.bill-amount {
	margin-top: 25px;
}

.bill-amount .icon-cospend,
.bill-currency-convert .icon-currencies {
	display: inline-block;
	padding-left: 34px !important;
}

.bill-amount label,
.bill-currency-convert label {
	padding-top: 10px;
}

.bill-repeat-include {
	text-align: left;
	margin-top: 5px;
	margin-bottom: 5px;
	padding-left: 8px;
}

.modehint {
	max-width: 500px;
}
</style>
