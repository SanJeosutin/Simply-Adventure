"use strict";

import debugLog from '../Logic/debug.js';


export default class Progress {
    constructor() {
        this.activeActions = new Map();
        this.fireCycles = new Map();
        this.fireWarnings = new Map();
        this.progressID = 0;
    }

    isActive(action) {
        return this.activeActions.has(action);
    }

    start(action, label, duration, onComplete = () => {}) {
        if (this.isActive(action)) {
            return false;
        }

        const actionName = action.replace('#', '');
        const progressID = `${actionName}-progress-${++this.progressID}`;
        const semanticProgressID = `${progressID}-status`;
        const startTime = performance.now();

        $(action).append(
            `<span class="action-progress-track" id="${progressID}" aria-hidden="true">
                <span class="action-progress-fill"></span>
            </span>`
        );
        $('#action-progress-status').append(
            `<div id="${semanticProgressID}" role="progressbar" aria-label="${label} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% complete"></div>`
        );

        const actionProgress = {
            animationFrame: null,
            progressID,
            semanticProgressID,
            startTime,
        };

        this.activeActions.set(action, actionProgress);
        this.announce(`${label} started.`);
        debugLog(`${label} progress started.`);

        const updateProgress = currentTime => {
            const elapsed = currentTime - startTime;
            const percentage = Math.min(100, Math.floor((elapsed / duration) * 100));

            this.updateProgress(progressID, percentage, 'complete');

            if (percentage < 100 && this.isActive(action)) {
                actionProgress.animationFrame = requestAnimationFrame(updateProgress);
            }
        };

        actionProgress.animationFrame = requestAnimationFrame(updateProgress);
        actionProgress.completionTimer = setTimeout(() => {
            cancelAnimationFrame(actionProgress.animationFrame);
            this.updateProgress(progressID, 100, 'complete');
            this.activeActions.delete(action);
            onComplete();
            this.announce(`${label} complete.`);

            setTimeout(() => {
                $(`#${progressID}`).remove();
                $(`#${semanticProgressID}`).remove();
            }, 300);
        }, duration);

        return true;
    }

    renderCampFireTimers(activeFires, duration) {
        const activeFireIDs = new Set(activeFires.map(fire => fire.id));

        this.fireCycles.forEach((cycleStartedAt, fireID) => {
            if (!activeFireIDs.has(fireID)) {
                $(`#camp-fire-progress-${fireID}`).remove();
                this.fireCycles.delete(fireID);
                this.fireWarnings.delete(fireID);
            }
        });

        if (!activeFires.length) {
            $('#camp-fire-progress-row').remove();
            return;
        }

        this.createCampFireProgressContainer();

        activeFires.forEach(fire => {
            const progressID = `camp-fire-progress-${fire.id}`;

            if (!$(`#${progressID}`).length) {
                $('#camp-fire-progress-list').append(
                    `<div class="camp-fire-progress-item" id="${progressID}">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <span class="camp-fire-progress-label">Camp Fire ${fire.id}</span>
                            <span class="camp-fire-progress-value text-muted" aria-hidden="true">100%</span>
                        </div>
                        <div class="progress" role="progressbar" aria-label="Camp Fire ${fire.id} fuel time remaining" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100" aria-valuetext="100% time remaining">
                            <div class="progress-bar bg-success" style="width: 100%"></div>
                        </div>
                    </div>`
                );
            }

            const timeRemaining = Math.max(0, fire.fuelDueAt - Date.now());
            const percentage = Math.min(100, Math.ceil((timeRemaining / duration) * 100));
            const progressBar = $(`#${progressID} .progress-bar`);
            const progress = $(`#${progressID} .progress`);
            const warningLevel = percentage <= 20 ? 'danger' : percentage <= 50 ? 'warning' : 'success';

            progressBar
                .removeClass('bg-success bg-warning bg-danger')
                .addClass(`bg-${warningLevel}`)
                .css('width', `${percentage}%`);
            progress
                .attr('aria-valuenow', percentage)
                .attr('aria-valuetext', `${percentage}% time remaining`);
            $(`#${progressID} .camp-fire-progress-value`).text(`${percentage}%`);

            this.announceFireWarning(fire, percentage);
        });
    }

    createCampFireProgressContainer() {
        if ($('#camp-fire-progress-row').length || !$('#display-camp_fire').length) {
            return;
        }

        $('#display-camp_fire').after(
            `<tr id="camp-fire-progress-row">
                <td colspan="2" class="pt-0">
                    <div class="camp-fire-progress-list" id="camp-fire-progress-list"></div>
                </td>
            </tr>`
        );
    }

    announceFireWarning(fire, percentage) {
        const previousCycle = this.fireCycles.get(fire.id);

        if (previousCycle !== fire.cycleStartedAt) {
            this.fireCycles.set(fire.id, fire.cycleStartedAt);
            this.fireWarnings.delete(fire.id);
            return;
        }

        if (percentage <= 20 && this.fireWarnings.get(fire.id) !== 'danger') {
            this.fireWarnings.set(fire.id, 'danger');
            this.announce(`Camp Fire ${fire.id} has 20% fuel time remaining.`);
        } else if (percentage <= 50 && !this.fireWarnings.has(fire.id)) {
            this.fireWarnings.set(fire.id, 'warning');
            this.announce(`Camp Fire ${fire.id} has 50% fuel time remaining.`);
        }
    }

    updateProgress(progressID, percentage, suffix) {
        const semanticProgress = $(`#${progressID}-status`);

        $(`#${progressID} .action-progress-fill`).css('width', `${percentage}%`);
        semanticProgress
            .attr('aria-valuenow', percentage)
            .attr('aria-valuetext', `${percentage}% ${suffix}`);
    }

    announce(message) {
        $('#action-status').text(message);
    }
}
