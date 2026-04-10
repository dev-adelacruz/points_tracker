# frozen_string_literal: true

class HostBadgeBlueprint < Blueprinter::Base
  identifier :id

  fields :badge_key, :earned_on, :notified

  field :label do |badge|
    HostBadge::BADGES.dig(badge.badge_key, :label)
  end

  field :emoji do |badge|
    HostBadge::BADGES.dig(badge.badge_key, :emoji)
  end

  field :description do |badge|
    HostBadge::BADGES.dig(badge.badge_key, :description)
  end
end
