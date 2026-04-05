# frozen_string_literal: true

class AuditLog < ApplicationRecord
  belongs_to :actor, class_name: "User"
  belongs_to :auditable, polymorphic: true, optional: true

  ACTIONS = %w[create update deactivate].freeze

  validates :action, inclusion: { in: ACTIONS }
  validates :auditable_type, :auditable_id, presence: true
end
