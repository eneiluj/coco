<template>
    <AppNavigationItem
        class="memberItem"
        :title="nameTitle"
        :forceMenu="true"
        v-show="memberVisible"
        >
        <div class="memberAvatar" slot="icon">
            <ColorPicker class="app-navigation-entry-bullet-wrapper memberColorPicker" :value="`#${member.color}`" @input="updateColor" ref="col">
                <div class="disabledMask" v-show="!member.activated"></div>
                <img :src="memberAvatar"/>
            </ColorPicker>
        </div>
        <template slot="counter">
            <span :class="balanceClass">{{ balanceCounter }}</span>
        </template>
        <template slot="actions">
            <ActionInput :disabled="false" icon="icon-rename" type="text" :value="member.name"
                ref="nameInput" @submit="onNameSubmit"
                >
            </ActionInput>
            <ActionInput :disabled="false" icon="icon-quota" type="number" step="0.1" :value="''"
                ref="weightInput" @submit="onWeightSubmit"
                >
                {{ t('cospend', 'Weight') }} ({{ member.weight }})
            </ActionInput>
            <ActionButton icon="icon-palette" @click="onMenuColorClick">
                {{ t('cospend', 'Change color') }}
            </ActionButton>
            <ActionButton :icon="member.activated ? 'icon-delete' : 'icon-history'" @click="onDeleteMemberClick">
                {{ member.activated ? t('cospend', 'Deactivate') : t('cospend', 'Reactivate') }}
            </ActionButton>
        </template>
    </AppNavigationItem>
</template>

<script>
import ClickOutside from 'vue-click-outside'
import {
    ActionButton, AppNavigation as AppNavigationVue, AppNavigationIconBullet,
    AppNavigationSettings, AppNavigationItem, ActionInput, ColorPicker
} from '@nextcloud/vue'
import { generateUrl, generateOcsUrl } from '@nextcloud/router'
import cospend from '../state';
import {getMemberName, getSmartMemberName, getMemberAvatar} from '../member';

export default {
    name: 'AppNavigationMemberItem',
    components: {
        AppNavigationVue,
        AppNavigationItem,
        AppNavigationSettings,
        AppNavigationIconBullet,
        ActionButton,
        ActionInput, ColorPicker
    },
    directives: {
        ClickOutside,
    },
    props: ['member', 'projectId'],
    data() {
        return {
        }
    },
    computed: {
        nameTitle() {
            return this.member.name + ((this.member.weight !== 1.0) ? (' (x' + this.member.weight + ')') : '');
        },
        balanceCounter() {
            if (this.member.balance < 0.01 && this.member.balance > -0.01) {
                return '0.00';
            } else {
                return this.member.balance.toFixed(2);
            }
        },
        color() {
            return '#' + this.member.color;
        },
        memberAvatar() {
            return getMemberAvatar(this.projectId, this.member.id);
        },
        smartMemberName() {
            return getSmartMemberName(this.projectId, this.member.id);
        },
        balanceClass() {
            let balanceClass = '';
            if (this.member.balance >= 0.01) {
                balanceClass = ' balancePositive';
            } else if (this.member.balance <= -0.01) {
                balanceClass = ' balanceNegative';
            }
            return 'balance ' + balanceClass;
        },
        memberVisible() {
            const balance = this.member.balance;
            return (balance >= 0.01 || balance <= -0.01 || this.member.activated);
        },
    },

    methods: {
        onDeleteMemberClick() {
            this.member.activated = !this.member.activated;
            this.$emit('memberEdited', this.projectId, this.member.id);
        },
        onNameSubmit() {
            const newName = this.$refs.nameInput.$el.querySelector('input[type="text"]').value;
            this.member.name = newName;
            this.$emit('memberEdited', this.projectId, this.member.id);
        },
        onWeightSubmit() {
            const newWeight = this.$refs.weightInput.$el.querySelector('input[type="number"]').value;
            this.member.weight = parseFloat(newWeight);
            this.$emit('memberEdited', this.projectId, this.member.id);
        },
        updateColor(color) {
            console.log('uiiii '+color)
            this.member.color = color.replace('#', '');
            this.$emit('memberEdited', this.projectId, this.member.id);
        },
        onMenuColorClick() {
            console.log('ccc')
            this.$refs.col.$el.querySelector('.trigger').click();
        },
    },

}
</script>

<style scoped lang="scss">

.memberItem {
    padding-left: 30px !important;
}
</style>