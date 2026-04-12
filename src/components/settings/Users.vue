<template>
    <div>
        <!-- Add user form -->
        <div class="add-btn mb-3">
            <button class="btn btn-primary" type="button" @click="showAddForm = !showAddForm">
                <font-awesome-icon icon="plus" />
                {{ $t("Add User") }}
            </button>
        </div>

        <div v-if="showAddForm" class="shadow-box mb-4 p-3">
            <h4>{{ $t("Add User") }}</h4>
            <div class="mb-2">
                <label class="form-label">{{ $t("Username") }}</label>
                <input v-model="newUser.username" type="text" class="form-control" autocomplete="off" />
            </div>
            <div class="mb-2">
                <label class="form-label">{{ $t("Password") }}</label>
                <input v-model="newUser.password" type="password" class="form-control" autocomplete="new-password" />
            </div>
            <div class="mb-3">
                <label class="form-label">{{ $t("Role") }}</label>
                <select v-model="newUser.role" class="form-select">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <button class="btn btn-primary me-2" @click="addUser">{{ $t("Save") }}</button>
            <button class="btn btn-secondary" @click="showAddForm = false; resetForm()">{{ $t("Cancel") }}</button>
        </div>

        <!-- User list -->
        <div v-if="users.length === 0" class="d-flex align-items-center justify-content-center my-3">
            {{ $t("No users found") }}
        </div>

        <div v-for="user in users" :key="user.id" class="item">
            <div class="left-part">
                <div class="info">
                    <div class="title">{{ user.username }}</div>
                    <div class="role-badge" :class="user.role">{{ user.role }}</div>
                </div>
            </div>
            <div class="buttons">
                <button
                    v-if="user.username !== currentUsername"
                    class="btn btn-danger btn-sm"
                    @click="confirmDelete(user)"
                >
                    <font-awesome-icon icon="trash" />
                    {{ $t("Delete") }}
                </button>
                <span v-else class="text-muted small">(you)</span>
            </div>
        </div>

        <Confirm
            ref="confirmDeleteDialog"
            btn-style="btn-danger"
            :yes-text="$t('Yes')"
            :no-text="$t('No')"
            @yes="deleteUser"
        >
            {{ $t("Are you sure?") }}
        </Confirm>
    </div>
</template>

<script>
import Confirm from "../Confirm.vue";

export default {
    components: { Confirm },

    data() {
        return {
            users: [],
            showAddForm: false,
            newUser: { username: "", password: "", role: "user" },
            selectedUserID: null,
        };
    },

    computed: {
        currentUsername() {
            return this.$root.username;
        },
    },

    mounted() {
        this.loadUsers();
    },

    methods: {
        loadUsers() {
            this.$root.getSocket().emit("getUsers", (res) => {
                if (res.ok) {
                    this.users = res.users;
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        addUser() {
            if (!this.newUser.username.trim() || !this.newUser.password) {
                this.$root.toastError("Username and password are required");
                return;
            }
            this.$root.getSocket().emit("addUser", this.newUser, (res) => {
                if (res.ok) {
                    this.$root.toastSuccess("User added successfully");
                    this.showAddForm = false;
                    this.resetForm();
                    this.loadUsers();
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        confirmDelete(user) {
            this.selectedUserID = user.id;
            this.$refs.confirmDeleteDialog.show();
        },

        deleteUser() {
            this.$root.getSocket().emit("deleteUser", this.selectedUserID, (res) => {
                if (res.ok) {
                    this.$root.toastSuccess("User deleted");
                    this.loadUsers();
                } else {
                    this.$root.toastError(res.msg);
                }
            });
        },

        resetForm() {
            this.newUser = { username: "", password: "", role: "user" };
        },
    },
};
</script>

<style scoped>
.item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-radius: 10px;
    margin-bottom: 8px;
    background: rgba(0, 0, 0, 0.03);
}

.dark .item {
    background: rgba(255, 255, 255, 0.05);
}

.title {
    font-weight: 600;
    font-size: 15px;
}

.role-badge {
    display: inline-block;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 20px;
    margin-top: 3px;
    font-weight: 500;
}

.role-badge.admin {
    background: #5470e4;
    color: #fff;
}

.role-badge.user {
    background: #6c757d;
    color: #fff;
}
</style>
