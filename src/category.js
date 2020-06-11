/*jshint esversion: 6 */

import Vue from 'vue';
import './bootstrap';
import cospend from './state';
import CategoryManagement from './CategoryManagement';
import {getProjectName, selectProject} from './project';

export function categoryEvents() {
    $('body').on('click', '.manageProjectCategories', function() {
        const projectid = $(this).parent().parent().parent().parent().attr('projectid');
        displayCategories(projectid);
    });
}

export function getCategory(projectid, catId) {
    let catName, catIcon, catColor;
    if (cospend.hardCodedCategories.hasOwnProperty(catId)) {
        catIcon = cospend.hardCodedCategories[catId].icon;
        catName = cospend.hardCodedCategories[catId].name;
        catColor = cospend.hardCodedCategories[catId].color;
    } else if (cospend.projects[projectid].categories.hasOwnProperty(catId)) {
        catIcon = cospend.projects[projectid].categories[catId].icon;
        catName = cospend.projects[projectid].categories[catId].name;
        catColor = cospend.projects[projectid].categories[catId].color || 'red';
    } else {
        catName = t('cospend', 'No category');
        catIcon = '';
        catColor = '#000000';
    }

    return {
        name: catName,
        icon: catIcon,
        color: catColor,
    }
}

export function displayCategories(projectid) {
    // deselect bill
    $('.billitem').removeClass('selectedbill');
    const projectName = getProjectName(projectid);
    $('#billdetail').html('');
    $('.app-content-list').addClass('showdetails');
    const titleStr = t('cospend', 'Categories of project {name}', {name: projectName});

    $('#billdetail').html('');
    $('#billdetail').append($('<div/>', {id: 'app-details-toggle', tabindex: 0, class: 'icon-confirm'}))
        .append(
            $('<h2/>', {id: 'catTitle', projectid: projectid})
                .append($('<span/>', {class: 'icon-category-app-bundles'}))
                .append(titleStr)
        )
        .append($('<div/>', {id: 'manage-categories'}));

    new Vue({
        el: "#manage-categories",
        render: h => h(CategoryManagement),
    });
}