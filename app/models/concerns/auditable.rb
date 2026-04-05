# frozen_string_literal: true

module Auditable
  extend ActiveSupport::Concern

  IGNORED_FIELDS = %w[
    updated_at created_at jti encrypted_password
    reset_password_token reset_password_sent_at remember_created_at
  ].freeze

  included do
    after_create  :log_create_audit
    after_update  :log_update_audit
  end

  private

  def log_create_audit
    return unless Current.user

    AuditLog.create!(
      actor:          Current.user,
      action:         "create",
      auditable_type: self.class.name,
      auditable_id:   id,
      auditable_label: audit_label,
      changes_data:   {}
    )
  end

  def log_update_audit
    return unless Current.user

    relevant = saved_changes.except(*IGNORED_FIELDS)
    return if relevant.blank?

    action = (relevant.key?("active") && relevant["active"].last == false) ? "deactivate" : "update"

    AuditLog.create!(
      actor:          Current.user,
      action:         action,
      auditable_type: self.class.name,
      auditable_id:   id,
      auditable_label: audit_label,
      changes_data:   relevant
    )
  end

  def audit_label
    respond_to?(:name) ? name.to_s : "#{self.class.name} ##{id}"
  end
end
