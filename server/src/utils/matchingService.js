const connectionModel = require('../modal/connection');
const blockModel = require('../modal/block');

/**
 * Standardize interest / preference string to one of: 'female', 'male', 'everyone'
 * @param {string} preference 
 * @returns {'female' | 'male' | 'everyone'}
 */
function normalizePreference(preference) {
    if (!preference) return 'everyone';
    const clean = preference.toString().toLowerCase().trim();
    if (['female', 'women', 'woman', 'girl', 'girls'].includes(clean)) {
        return 'female';
    }
    if (['male', 'men', 'man', 'boy', 'boys'].includes(clean)) {
        return 'male';
    }
    return 'everyone';
}

/**
 * Standardize user gender string to one of: 'female', 'male', 'other'
 * @param {string} gender 
 * @returns {'female' | 'male' | 'other'}
 */
function normalizeGender(gender) {
    if (!gender) return 'other';
    const clean = gender.toString().toLowerCase().trim();
    if (['female', 'woman', 'women', 'girl'].includes(clean)) {
        return 'female';
    }
    if (['male', 'man', 'men', 'boy'].includes(clean)) {
        return 'male';
    }
    return 'other';
}

/**
 * Get MongoDB gender query array based on target preference
 * @param {'female' | 'male' | 'everyone'} normalizedPref 
 * @returns {Array<string>}
 */
function getTargetGenderArray(normalizedPref) {
    if (normalizedPref === 'female') {
        return ['female', 'woman', 'women'];
    }
    if (normalizedPref === 'male') {
        return ['male', 'man', 'men'];
    }
    // Everyone: all genders
    return ['female', 'woman', 'women', 'male', 'man', 'men', 'other'];
}

/**
 * Build a comprehensive MongoDB discovery query for a user
 * @param {Object} currentUser The requesting user document
 * @param {Object} additionalOptions Additional query filters (category, ageMin, ageMax, query, skills, location)
 * @returns {Promise<Object>} MongoDB filter object
 */
async function buildDiscoveryQuery(currentUser, additionalOptions = {}) {
    const filter = {
        role: 'user',
        accountStatus: 'active'
    };

    let excludedUserIds = [];

    if (currentUser && currentUser._id) {
        const currentUserId = currentUser._id;
        excludedUserIds.push(currentUserId);

        // 1. Exclude interacted users (swiped like, passed, matched)
        const existingConnections = await connectionModel.find({
            $or: [{ fromUserId: currentUserId }, { toUserId: currentUserId }]
        }).select('fromUserId toUserId');

        existingConnections.forEach(conn => {
            if (conn.fromUserId.toString() === currentUserId.toString()) {
                excludedUserIds.push(conn.toUserId);
            } else {
                excludedUserIds.push(conn.fromUserId);
            }
        });

        // 2. Exclude blocked users
        const blocks = await blockModel.find({
            $or: [{ blockerId: currentUserId }, { blockedId: currentUserId }]
        }).select('blockerId blockedId');

        blocks.forEach(b => {
            excludedUserIds.push(b.blockerId);
            excludedUserIds.push(b.blockedId);
        });

        filter._id = { $nin: excludedUserIds };

        // 3. Strict Sexual / Romantic Interest Filtering:
        // Priority: currentUser.interestedIn -> currentUser.preferences.gender -> currentUser.lookingFor
        const rawPref = currentUser.interestedIn || currentUser.preferences?.gender || currentUser.lookingFor || 'everyone';
        const normalizedPref = normalizePreference(rawPref);
        const targetGenders = getTargetGenderArray(normalizedPref);

        // Target user's gender MUST match current user's preference
        filter.gender = { $in: targetGenders };

        // 4. Age range preference
        const ageMin = additionalOptions.ageMin || currentUser.preferences?.ageMin;
        const ageMax = additionalOptions.ageMax || currentUser.preferences?.ageMax;
        if (ageMin || ageMax) {
            filter.age = {};
            if (ageMin) filter.age.$gte = Number(ageMin);
            if (ageMax) filter.age.$lte = Number(ageMax);
        }
    } else {
        // Guest user fallback (if any)
        if (additionalOptions.gender && additionalOptions.gender !== 'all' && additionalOptions.gender !== 'everyone') {
            filter.gender = { $in: getTargetGenderArray(normalizePreference(additionalOptions.gender)) };
        }
    }

    // Category / Relationship goal filter (e.g. for Explore)
    if (additionalOptions.category && additionalOptions.category !== 'all') {
        const cat = additionalOptions.category;
        if (['long-term', 'short-term', 'new-friends', 'figuring-out'].includes(cat)) {
            filter.relationshipGoal = cat;
        } else if (cat === 'gamers') {
            filter.$or = [
                { interests: { $in: ['Gaming', 'Games', 'Tech', 'Esports'] } },
                { skills: { $in: ['Gaming', 'Game Dev', 'Tech'] } }
            ];
        }
    }

    // Location / City filter
    if (additionalOptions.location && additionalOptions.location.trim()) {
        filter.location = new RegExp(additionalOptions.location.trim(), 'i');
    }

    // Skills filter
    if (additionalOptions.skills) {
        const skillList = Array.isArray(additionalOptions.skills)
            ? additionalOptions.skills
            : additionalOptions.skills.split(',').map(s => s.trim()).filter(Boolean);

        if (skillList.length > 0) {
            filter.skills = { $in: skillList };
        }
    }

    // General text search
    if (additionalOptions.query && additionalOptions.query.trim()) {
        const regex = new RegExp(additionalOptions.query.trim(), 'i');
        const textQuery = [
            { firstName: regex },
            { lastName: regex },
            { job: regex },
            { location: regex },
            { bio: regex },
            { skills: regex },
            { interests: regex }
        ];

        if (filter.$or) {
            filter.$and = [{ $or: filter.$or }, { $or: textQuery }];
            delete filter.$or;
        } else {
            filter.$or = textQuery;
        }
    }

    return filter;
}

module.exports = {
    normalizePreference,
    normalizeGender,
    getTargetGenderArray,
    buildDiscoveryQuery
};
