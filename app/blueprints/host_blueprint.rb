# frozen_string_literal: true

class HostBlueprint < Blueprinter::Base
  identifier :id

  fields :name, :email, :active

  field :team_id do |host|
    host.primary_team&.id
  end

  field :team_name do |host|
    host.primary_team&.name
  end

  field :badges do |host|
    host.host_badges.order(:earned_on).map do |b|
      {
        badge_key: b.badge_key,
        label: HostBadge::BADGES.dig(b.badge_key, :label),
        emoji: HostBadge::BADGES.dig(b.badge_key, :emoji),
        earned_on: b.earned_on
      }
    end
  end
end
