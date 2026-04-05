# frozen_string_literal: true

class HostMailer < ApplicationMailer
  def coins_logged(coin_entry)
    @coin_entry = coin_entry
    @host = coin_entry.user
    @session = coin_entry.session

    @coins_earned = coin_entry.coins
    @session_date = @session.date.strftime("%B %-d, %Y")
    @session_slot = @session.session_slot == "slot_one" ? "First Slot" : "Second Slot"

    month_start = @session.date.beginning_of_month
    month_end = @session.date.end_of_month
    @monthly_total = CoinEntry
      .joins(:session)
      .where(user: @host)
      .where(sessions: { date: month_start..month_end })
      .sum(:coins)

    mail(to: @host.email, subject: "Your coins have been logged — #{@session_date}")
  end
end
