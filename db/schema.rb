# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_03_28_163801) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "coin_entries", force: :cascade do |t|
    t.integer "coins", default: 0, null: false
    t.datetime "created_at", null: false
    t.bigint "session_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["session_id", "user_id"], name: "index_coin_entries_on_session_id_and_user_id", unique: true
    t.index ["session_id"], name: "index_coin_entries_on_session_id"
    t.index ["user_id"], name: "index_coin_entries_on_user_id"
  end

  create_table "coin_entry_audits", force: :cascade do |t|
    t.bigint "coin_entry_id", null: false
    t.datetime "created_at", null: false
    t.bigint "edited_by_id", null: false
    t.integer "previous_coins", null: false
    t.datetime "updated_at", null: false
    t.index ["coin_entry_id"], name: "index_coin_entry_audits_on_coin_entry_id"
    t.index ["edited_by_id"], name: "index_coin_entry_audits_on_edited_by_id"
  end

  create_table "session_hosts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "session_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["session_id", "user_id"], name: "index_session_hosts_on_session_id_and_user_id", unique: true
    t.index ["session_id"], name: "index_session_hosts_on_session_id"
    t.index ["user_id"], name: "index_session_hosts_on_user_id"
  end

  create_table "sessions", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.date "date", null: false
    t.integer "session_slot", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_id"], name: "index_sessions_on_created_by_id"
    t.index ["date", "session_slot", "team_id"], name: "index_sessions_on_date_slot_team", unique: true
    t.index ["team_id"], name: "index_sessions_on_team_id"
  end

  create_table "system_settings", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "key", null: false
    t.datetime "updated_at", null: false
    t.string "value", null: false
    t.index ["key"], name: "index_system_settings_on_key", unique: true
  end

  create_table "team_emcee_assignments", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["team_id"], name: "index_team_emcee_assignments_on_team_id"
    t.index ["team_id"], name: "index_team_emcee_assignments_on_team_id_active", unique: true, where: "(active = true)"
    t.index ["user_id"], name: "index_team_emcee_assignments_on_user_id"
  end

  create_table "team_memberships", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.bigint "team_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["team_id", "user_id"], name: "index_team_memberships_on_team_id_and_user_id", unique: true
    t.index ["team_id"], name: "index_team_memberships_on_team_id"
    t.index ["user_id"], name: "index_team_memberships_on_user_id"
  end

  create_table "teams", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_teams_on_active"
    t.index ["name"], name: "index_teams_on_name", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "jti"
    t.integer "monthly_coin_quota", default: 0, null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 2, null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_users_on_active"
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
  end

  add_foreign_key "coin_entries", "sessions"
  add_foreign_key "coin_entries", "users"
  add_foreign_key "coin_entry_audits", "coin_entries"
  add_foreign_key "coin_entry_audits", "users", column: "edited_by_id"
  add_foreign_key "session_hosts", "sessions"
  add_foreign_key "session_hosts", "users"
  add_foreign_key "sessions", "teams"
  add_foreign_key "sessions", "users", column: "created_by_id"
  add_foreign_key "team_emcee_assignments", "teams"
  add_foreign_key "team_emcee_assignments", "users"
  add_foreign_key "team_memberships", "teams"
  add_foreign_key "team_memberships", "users"
end
