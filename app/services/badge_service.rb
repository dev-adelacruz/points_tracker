# frozen_string_literal: true

class BadgeService
  def self.evaluate(host)
    new(host).evaluate
  end

  def initialize(host)
    @host = host
  end

  def evaluate
    award("first_quota")    if qualifies_first_quota?
    award("three_month_streak") if qualifies_three_month_streak?
    award("top_performer")  if qualifies_top_performer?
    award("century_coins")  if qualifies_century_coins?
    award("veteran_host")   if qualifies_veteran_host?
  end

  private

  def award(key)
    return if @host.host_badges.exists?(badge_key: key)

    @host.host_badges.create!(badge_key: key, earned_on: Date.current)
  end

  def monthly_coins(month_start, month_end)
    session_ids = Session
      .where(team_id: @host.teams.pluck(:id))
      .where(date: month_start..month_end)
      .pluck(:id)
    CoinEntry.where(user: @host, session_id: session_ids).sum(:coins)
  end

  def quota
    User::MONTHLY_COIN_QUOTA
  end

  def qualifies_first_quota?
    month_start = Date.current.beginning_of_month
    month_end   = Date.current.end_of_month
    monthly_coins(month_start, month_end) >= quota
  end

  def qualifies_three_month_streak?
    (0..2).all? do |months_ago|
      date      = Date.current - months_ago.months
      start_d   = date.beginning_of_month
      end_d     = date.end_of_month
      monthly_coins(start_d, end_d) >= quota
    end
  end

  def qualifies_top_performer?
    month_start = Date.current.beginning_of_month
    month_end   = Date.current.end_of_month

    session_ids_by_host = User.host.each_with_object({}) do |host, h|
      h[host.id] = Session
        .where(team_id: host.teams.pluck(:id))
        .where(date: month_start..month_end)
        .pluck(:id)
    end

    my_coins = CoinEntry.where(user: @host, session_id: session_ids_by_host[@host.id] || []).sum(:coins)
    return false if my_coins < quota

    User.host.all? do |host|
      next true if host.id == @host.id

      other_coins = CoinEntry.where(user: host, session_id: session_ids_by_host[host.id] || []).sum(:coins)
      my_coins >= other_coins
    end
  end

  def qualifies_century_coins?
    month_start = Date.current.beginning_of_month
    month_end   = Date.current.end_of_month
    monthly_coins(month_start, month_end) >= 100_000
  end

  def qualifies_veteran_host?
    session_ids = Session.where(team_id: @host.teams.pluck(:id)).pluck(:id)
    CoinEntry.where(user: @host, session_id: session_ids).distinct.count(:session_id) >= 50
  end
end
